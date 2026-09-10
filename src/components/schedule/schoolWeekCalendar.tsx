import { createClient } from "@/lib/supabase/server";
import WeekSchedule from "./week";
import type { ScheduleInstance } from "./instanceCard";
import { volunteerColorIndex } from "@/lib/volunteerColor";
import { getViewerSchoolContext } from "@/lib/volunteerContext";

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Date-only strings need a fixed UTC time when parsed, otherwise
// `new Date("2026-09-07")` and the viewer's local timezone can disagree
// about which calendar day it actually is.
function shiftDate(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Crossing patrols only run on school days, so the week grid is Monday..
// Friday regardless of which day of the requested week `date` falls on.
function mondayOf(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  const dayOfWeek = d.getUTCDay(); // 0=Sunday..6=Saturday
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  d.setUTCDate(d.getUTCDate() - daysSinceMonday);
  return d.toISOString().slice(0, 10);
}

// A school's week schedule - fetches the term/instance data and renders
// WeekSchedule for it. Shared between the public school page
// (schools/[schoolId]/page.tsx) and the "My calendar" dashboard tab, so
// there's one place that knows how to turn (schoolId, date) into a week's
// worth of coverage rather than two copies drifting apart.
export default async function SchoolWeekCalendar({
  schoolId,
  schoolName,
  date,
  extraParams,
}: {
  schoolId: number;
  schoolName: string;
  date?: string;
  extraParams?: Record<string, string>;
}) {
  const monday = mondayOf(date ?? toIsoDate(new Date()));
  const weekDays = Array.from({ length: 5 }, (_, i) => shiftDate(monday, i));
  const friday = weekDays[4];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Any term overlapping the week - usually one, but a week straddling a
  // half-term boundary can have part of it in one term row and part in the
  // next (or in neither, during the break itself).
  const { data: terms } = await supabase
    .from("terms")
    .select("id, start_date, end_date")
    .eq("school_id", schoolId)
    .lte("start_date", friday)
    .gte("end_date", monday);
  const termIds = (terms ?? []).map((t) => t.id);

  const { data: instances } =
    termIds.length > 0
      ? await supabase
          .from("slot_instances")
          .select(
            `*,
            slot:slots ( *, location:locations ( * ) ),
            signups ( *, volunteer:volunteers ( * ) )`
          )
          .in("term_id", termIds)
          .gte("date", monday)
          .lte("date", friday)
          .order("date")
          .order("start_time")
          .returns<ScheduleInstance[]>()
      : { data: [] };

  const instancesByDate = new Map<string, ScheduleInstance[]>();
  for (const instance of instances ?? []) {
    const existing = instancesByDate.get(instance.date) ?? [];
    existing.push(instance);
    instancesByDate.set(instance.date, existing);
  }

  const termCoversDate = (checkDate: string) =>
    (terms ?? []).some((t) => checkDate >= t.start_date && checkDate <= t.end_date);

  // Signing up auto-joins a volunteer to the school (see claimSlot) - the
  // dialog only needs to disclose that when it's actually going to happen.
  let isSchoolMember = false;
  let regularSlotIds = new Set<number>();
  if (user) {
    ({ isSchoolMember, regularSlotIds } = await getViewerSchoolContext(supabase, schoolId, user.id));
  }

  // Badge colour is a pure hash of volunteer_id (see volunteerColor.ts) -
  // two different volunteers can land on the same swatch by chance, which
  // is harmless on its own. It only actually confuses anyone if their
  // *names* also match, and only where a viewer would actually see both of
  // them together - i.e. right here, on this school's currently-loaded
  // week. Scoped to this data (rather than a global lookup) because a
  // volunteer's own RLS access only covers their own volunteer_schools
  // rows, not every other volunteer's school memberships.
  let nameCollision = false;
  if (user) {
    const seenVolunteers = new Map<string, { displayName: string; colorIndex: number }>();
    for (const instance of instances ?? []) {
      for (const signup of instance.signups) {
        if (signup.status !== "confirmed" || seenVolunteers.has(signup.volunteer_id)) continue;
        seenVolunteers.set(signup.volunteer_id, {
          displayName: signup.volunteer.display_name,
          colorIndex: volunteerColorIndex(signup.volunteer_id),
        });
      }
    }
    const mine = seenVolunteers.get(user.id);
    if (mine) {
      nameCollision = [...seenVolunteers].some(
        ([id, v]) => id !== user.id && v.displayName === mine.displayName && v.colorIndex === mine.colorIndex
      );
    }
  }

  return (
    <WeekSchedule
      monday={monday}
      days={weekDays}
      instancesByDate={instancesByDate}
      termCoversDate={termCoversDate}
      schoolId={schoolId}
      schoolName={schoolName}
      currentVolunteerId={user?.id ?? null}
      isSchoolMember={isSchoolMember}
      regularSlotIds={regularSlotIds}
      extraParams={extraParams}
      nameCollision={nameCollision}
    />
  );
}
