import type { ScheduleInstance } from "./instanceCard";
import CalendarNav from "./calendarNav";
import WeekDayCell from "./weekDayCell";

// Date-only strings need a fixed UTC time when parsed, otherwise
// `new Date("2026-09-07")` and the viewer's local timezone can disagree
// about which calendar day it actually is. Same helper as day.tsx.
function shiftDate(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDayHeading(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

function formatWeekHeading(monday: string, friday: string) {
  const start = new Date(`${monday}T00:00:00Z`);
  const end = new Date(`${friday}T00:00:00Z`);
  const startLabel = start.toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });
  const endLabel = end.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return `Week of ${startLabel} – ${endLabel}`;
}

// School streets slots are always either a morning drop-off or an
// afternoon pickup - a fixed two-way split rather than a continuous
// timeline, which was more precision than this data ever needed.
function isAfternoon(startTime: string) {
  return startTime >= "12:00";
}

const SESSIONS = [
  { key: "morning" as const, label: "Morning" },
  { key: "afternoon" as const, label: "Afternoon" },
];

export default function WeekSchedule({
  monday,
  days,
  instancesByDate,
  termCoversDate,
  schoolId,
  schoolName,
  currentVolunteerId,
  isSchoolMember,
  regularSlotIds,
  extraParams,
  nameCollision,
}: {
  monday: string;
  days: string[];
  instancesByDate: Map<string, ScheduleInstance[]>;
  termCoversDate: (date: string) => boolean;
  schoolId: number;
  schoolName: string;
  currentVolunteerId: string | null;
  isSchoolMember: boolean;
  regularSlotIds: Set<number>;
  // Other query params (e.g. which school a dashboard tab has selected)
  // that the prev/next week links need to preserve - a plain relative
  // `?date=...` href replaces the whole query string, which would
  // otherwise silently drop them.
  extraParams?: Record<string, string>;
  // True when the signed-in viewer shares both a display name and a badge
  // colour with someone else confirmed on this same week (see
  // schoolWeekCalendar.tsx) - the two of them would otherwise look
  // identical on this schedule.
  nameCollision?: boolean;
}) {
  const friday = days[days.length - 1];
  const hrefForDate = (date: string) => `?${new URLSearchParams({ ...extraParams, date }).toString()}`;
  const allInstances = days.flatMap((date) => instancesByDate.get(date) ?? []);

  // Distinct locations appearing anywhere in a session across the whole
  // week, in a stable order - this fixes how many side-by-side
  // subsections that session's row gets, so every day lines up under the
  // same columns even if one day's missing a location (an inset day, say).
  function locationsForSession(sessionKey: "morning" | "afternoon") {
    const seen = new Map<number, string>();
    for (const instance of allInstances) {
      if (isAfternoon(instance.start_time) === (sessionKey === "afternoon")) {
        seen.set(instance.slot.location.id, instance.slot.location.name);
      }
    }
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1])).map(([id]) => id);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">{formatWeekHeading(monday, friday)}</h2>
        <CalendarNav
          prevHref={hrefForDate(shiftDate(monday, -7))}
          nextHref={hrefForDate(shiftDate(monday, 7))}
          prevLabel="Previous week"
          nextLabel="Next week"
        />
      </div>

      {nameCollision && (
        <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          Someone else visible on this schedule shares both your name and badge colour. Consider changing
          your display name from your dashboard so you&apos;re easier to tell apart.
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <div className="min-w-[640px]">
          {/* Day headers, aligned with the grid columns below via a spacer
              matching the session-label column's width. */}
          <div className="flex border-b border-border">
            <div className="w-20 shrink-0" />
            <div className="grid min-w-0 flex-1 grid-cols-5">
              {days.map((date) => (
                <div
                  key={date}
                  className="border-l border-border px-2 py-2 text-center text-sm font-medium text-foreground"
                >
                  {formatDayHeading(date)}
                </div>
              ))}
            </div>
          </div>

          {SESSIONS.map((session) => {
            const locationIds = locationsForSession(session.key);

            return (
              <div key={session.key} className="flex border-b border-border last:border-b-0">
                <div className="flex w-20 shrink-0 items-center justify-center p-2 text-center text-sm font-medium text-muted-foreground">
                  {session.label}
                </div>
                <div className="grid min-w-0 flex-1 grid-cols-5">
                  {days.map((date) => {
                    const dayInstances = (instancesByDate.get(date) ?? []).filter(
                      (instance) => isAfternoon(instance.start_time) === (session.key === "afternoon")
                    );

                    return (
                      <div key={date} className="min-w-0 border-l border-border p-1.5">
                        <WeekDayCell
                          hasTerm={termCoversDate(date)}
                          instances={dayInstances}
                          locationIds={locationIds}
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
