import CalendarNav from "./calendarNav";
import MonthDayCell from "./monthDayCell";
import type { ScheduleInstance } from "./instanceCard";

function shiftDate(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function mondayOf(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  const dayOfWeek = d.getUTCDay(); // 0=Sunday..6=Saturday
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

function isAfternoon(startTime: string) {
  return startTime >= "12:00";
}

const WEEKDAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// A calendar month, Monday-Friday columns only (crossing patrols never run
// on weekends) x however many weeks the month spans as rows - each day
// cell a compact morning/afternoon x location swatch grid (see
// monthDayCell.tsx). "My calendar"'s middle ground between the week grid
// (too little at once) and the term agenda (too much at once). Days
// belonging to the adjacent month, needed to fill out the first/last
// week's row, still show their real data - only their date number is
// dimmed - since a slot on one of those days is exactly as real as any
// other.
export default function MonthGrid({
  year,
  month,
  instancesByDate,
  termCoversDate,
  schoolId,
  schoolName,
  currentVolunteerId,
  isSchoolMember,
  regularSlotIds,
  prevMonthDate,
  nextMonthDate,
  extraParams,
}: {
  year: number;
  month: number; // 1-indexed
  instancesByDate: Map<string, ScheduleInstance[]>;
  termCoversDate: (date: string) => boolean;
  schoolId: number;
  schoolName: string;
  currentVolunteerId: string | null;
  isSchoolMember: boolean;
  regularSlotIds: Set<number>;
  prevMonthDate: string;
  nextMonthDate: string;
  // Other query params (e.g. which school/view a dashboard tab has
  // selected) that the prev/next month links need to preserve - see
  // week.tsx's own extraParams comment for the same gap this closes.
  extraParams?: Record<string, string>;
}) {
  const firstOfMonth = `${year}-${pad(month)}-01`;
  const lastOfMonth = `${year}-${pad(month)}-${pad(daysInMonth(year, month))}`;
  const gridStartMonday = mondayOf(firstOfMonth);
  const gridEndMonday = mondayOf(lastOfMonth);

  const weekMondays: string[] = [];
  for (let d = gridStartMonday; d <= gridEndMonday; d = shiftDate(d, 7)) {
    weekMondays.push(d);
  }

  // Distinct locations appearing anywhere this month, per session, in a
  // stable order - fixes how many side-by-side swatch columns each
  // session gets, so every day lines up even if one's missing a location.
  const allInstances = [...instancesByDate.values()].flat();
  function locationsForSession(afternoon: boolean) {
    const seen = new Map<number, string>();
    for (const instance of allInstances) {
      if (isAfternoon(instance.start_time) === afternoon) {
        seen.set(instance.slot.location.id, instance.slot.location.name);
      }
    }
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1])).map(([id]) => id);
  }
  const morningLocationIds = locationsForSession(false);
  const afternoonLocationIds = locationsForSession(true);

  const hrefForDate = (targetDate: string) =>
    `?${new URLSearchParams({ ...extraParams, date: targetDate }).toString()}`;
  const monthLabel = new Date(`${firstOfMonth}T00:00:00Z`).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">{monthLabel}</h2>
        <CalendarNav
          prevHref={hrefForDate(prevMonthDate)}
          nextHref={hrefForDate(nextMonthDate)}
          prevLabel="Previous month"
          nextLabel="Next month"
        />
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[900px] space-y-1">
          <div className="grid grid-cols-5 gap-1">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="text-center text-sm font-medium text-muted-foreground">
                {label}
              </div>
            ))}
          </div>
          {weekMondays.map((monday) => (
            <div key={monday} className="grid grid-cols-5 gap-1">
              {Array.from({ length: 5 }, (_, i) => shiftDate(monday, i)).map((date) => {
                const inCurrentMonth = date >= firstOfMonth && date <= lastOfMonth;
                const dayNumber = Number(date.slice(8, 10));
                return (
                  <div key={date} className={inCurrentMonth ? "" : "opacity-50"}>
                    <MonthDayCell
                      dayNumber={dayNumber}
                      active={termCoversDate(date)}
                      instances={instancesByDate.get(date) ?? []}
                      morningLocationIds={morningLocationIds}
                      afternoonLocationIds={afternoonLocationIds}
                      schoolId={schoolId}
                      schoolName={schoolName}
                      currentVolunteerId={currentVolunteerId}
                      isSchoolMember={isSchoolMember}
                      regularSlotIds={regularSlotIds}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
