import { createClient } from "@/lib/supabase/server";
import { getViewerSchoolContext } from "@/lib/volunteerContext";
import DaySchedule, { type ScheduleInstance } from "./day";

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Fetches a single day's worth of a school's slots and renders
// DaySchedule - same fetch/present split as schoolWeekCalendar.tsx/week.tsx.
export default async function SchoolDayCalendar({
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
  const day = date ?? toIsoDate(new Date());
  const supabase = await createClient();

  const { data: terms } = await supabase
    .from("terms")
    .select("id")
    .eq("school_id", schoolId)
    .lte("start_date", day)
    .gte("end_date", day);
  const termIds = (terms ?? []).map((t) => t.id);
  const hasTerm = termIds.length > 0;

  const { data: instances } = hasTerm
    ? await supabase
        .from("slot_instances")
        .select(
          `*,
          slot:slots ( *, location:locations ( * ) ),
          signups ( *, volunteer:volunteers ( * ) )`
        )
        .in("term_id", termIds)
        .eq("date", day)
        .order("start_time")
        .returns<ScheduleInstance[]>()
    : { data: [] };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let isSchoolMember = false;
  let regularSlotIds = new Set<number>();
  if (user) {
    ({ isSchoolMember, regularSlotIds } = await getViewerSchoolContext(supabase, schoolId, user.id));
  }

  return (
    <DaySchedule
      date={day}
      hasTerm={hasTerm}
      instances={instances ?? []}
      schoolId={schoolId}
      schoolName={schoolName}
      currentVolunteerId={user?.id ?? null}
      isSchoolMember={isSchoolMember}
      regularSlotIds={regularSlotIds}
      extraParams={extraParams}
    />
  );
}
