import { createClient } from "@/lib/supabase/server";
import { getViewerSchoolContext } from "@/lib/volunteerContext";
import MonthGrid from "./monthGrid";
import type { ScheduleInstance } from "./instanceCard";

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function shiftDate(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function mondayOf(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  const dayOfWeek = d.getUTCDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  d.setUTCDate(d.getUTCDate() - daysSinceMonday);
  return d.toISOString().slice(0, 10);
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

// month is 1-indexed - returns the {year, month} that's `delta` months
// away, rolling over into adjacent years as needed.
function shiftMonth(year: number, month: number, delta: number) {
  const total = year * 12 + (month - 1) + delta;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

// Fetches one calendar month's worth of a school's slots (padded out to
// the full Monday-Friday weeks needed to fill the grid) and renders
// MonthGrid - same fetch/present split as schoolWeekCalendar.tsx/week.tsx.
export default async function SchoolMonthCalendar({
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
  const today = date ?? toIsoDate(new Date());
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));

  const firstOfMonth = `${year}-${pad(month)}-01`;
  const lastOfMonth = `${year}-${pad(month)}-${pad(daysInMonth(year, month))}`;
  const gridStart = mondayOf(firstOfMonth);
  const gridEnd = shiftDate(mondayOf(lastOfMonth), 4);

  const supabase = await createClient();

  const { data: terms } = await supabase
    .from("terms")
    .select("id, start_date, end_date")
    .eq("school_id", schoolId)
    .lte("start_date", gridEnd)
    .gte("end_date", gridStart);
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
          .gte("date", gridStart)
          .lte("date", gridEnd)
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let isSchoolMember = false;
  let regularSlotIds = new Set<number>();
  if (user) {
    ({ isSchoolMember, regularSlotIds } = await getViewerSchoolContext(supabase, schoolId, user.id));
  }

  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);

  return (
    <MonthGrid
      year={year}
      month={month}
      instancesByDate={instancesByDate}
      termCoversDate={termCoversDate}
      schoolId={schoolId}
      schoolName={schoolName}
      currentVolunteerId={user?.id ?? null}
      isSchoolMember={isSchoolMember}
      regularSlotIds={regularSlotIds}
      prevMonthDate={`${prev.year}-${pad(prev.month)}-01`}
      nextMonthDate={`${next.year}-${pad(next.month)}-01`}
      extraParams={extraParams}
    />
  );
}
