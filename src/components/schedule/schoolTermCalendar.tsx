import { createClient } from "@/lib/supabase/server";
import { pairHalfTerms } from "@/lib/terms";
import { getViewerSchoolContext } from "@/lib/volunteerContext";
import TermAgenda from "./termAgenda";
import type { ScheduleInstance } from "./instanceCard";

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Fetches a school's current term (both half-term rows paired into one
// season, see lib/terms.ts) and renders TermAgenda with just the viewer's
// *own* confirmed slots in it - the month/week views already cover "where
// else could I help"; a whole term of everyone else's "Needs volunteers"
// rows on top of that was too much to scan. Same fetch/present split as
// schoolWeekCalendar.tsx/week.tsx.
export default async function SchoolTermCalendar({
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
  const supabase = await createClient();

  const { data: rawTerms } = await supabase
    .from("terms")
    .select("id, name, start_date, end_date")
    .eq("school_id", schoolId)
    .order("start_date");
  const seasons = pairHalfTerms(rawTerms ?? []);

  const today = date ?? toIsoDate(new Date());
  // The season covering `today`, or the next upcoming one (mid-holiday);
  // falls back to the last known season once there's nothing left ahead
  // (rather than showing nothing at all).
  let seasonIndex = seasons.findIndex((s) => today <= s.end_date);
  if (seasonIndex === -1) seasonIndex = seasons.length - 1;
  const season = seasons[seasonIndex];

  if (!season) {
    return <p className="text-muted-foreground">No term dates set up for {schoolName} yet.</p>;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const instancesByDate = new Map<string, ScheduleInstance[]>();
  let isSchoolMember = false;
  let regularSlotIds = new Set<number>();
  if (user) {
    ({ isSchoolMember, regularSlotIds } = await getViewerSchoolContext(supabase, schoolId, user.id));

    const { data: mySignups } = await supabase
      .from("signups")
      .select("slot_instance_id")
      .eq("volunteer_id", user.id)
      .eq("status", "confirmed");
    const myInstanceIds = (mySignups ?? []).map((s) => s.slot_instance_id);

    const { data: instances } =
      myInstanceIds.length > 0
        ? await supabase
            .from("slot_instances")
            .select(
              `*,
              slot:slots ( *, location:locations ( * ) ),
              signups ( *, volunteer:volunteers ( * ) )`
            )
            .in("id", myInstanceIds)
            .in("term_id", season.ids)
            .order("date")
            .order("start_time")
            .returns<ScheduleInstance[]>()
        : { data: [] };

    for (const instance of instances ?? []) {
      const existing = instancesByDate.get(instance.date) ?? [];
      existing.push(instance);
      instancesByDate.set(instance.date, existing);
    }
  }

  const prevSeason = seasons[seasonIndex - 1];
  const nextSeason = seasons[seasonIndex + 1];

  return (
    <TermAgenda
      seasonName={season.name}
      seasonStartDate={season.start_date}
      seasonEndDate={season.end_date}
      prevSeasonStartDate={prevSeason?.start_date ?? null}
      nextSeasonStartDate={nextSeason?.start_date ?? null}
      instancesByDate={instancesByDate}
      schoolId={schoolId}
      schoolName={schoolName}
      currentVolunteerId={user?.id ?? null}
      isSchoolMember={isSchoolMember}
      regularSlotIds={regularSlotIds}
      extraParams={extraParams}
    />
  );
}
