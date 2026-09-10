import InstanceCard, { type ScheduleInstance } from "./instanceCard";
import CalendarNav from "./calendarNav";

export type { ScheduleInstance };

// Date-only strings need a fixed UTC time when parsed, otherwise
// `new Date("2026-09-07")` and the viewer's local timezone can disagree
// about which calendar day it actually is.
function shiftDate(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatLong(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function DaySchedule({
  date,
  hasTerm,
  instances,
  schoolId,
  schoolName,
  currentVolunteerId,
  isSchoolMember,
  regularSlotIds,
  extraParams,
}: {
  date: string;
  hasTerm: boolean;
  instances: ScheduleInstance[];
  schoolId: number;
  schoolName: string;
  currentVolunteerId: string | null;
  isSchoolMember: boolean;
  regularSlotIds: Set<number>;
  // Other query params (e.g. which view/school a caller has selected) that
  // the prev/next day links need to preserve - see week.tsx's own
  // extraParams comment for the same gap this closes.
  extraParams?: Record<string, string>;
}) {
  const hrefForDate = (targetDate: string) =>
    `?${new URLSearchParams({ ...extraParams, date: targetDate }).toString()}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">{formatLong(date)}</h2>
        <CalendarNav
          prevHref={hrefForDate(shiftDate(date, -1))}
          nextHref={hrefForDate(shiftDate(date, 1))}
          prevLabel="Previous day"
          nextLabel="Next day"
        />
      </div>

      {!hasTerm && (
        <p className="text-muted-foreground">No term covers this date.</p>
      )}

      {hasTerm && instances.length === 0 && (
        <p className="text-muted-foreground">
          No crossing patrol slots scheduled for this day.
        </p>
      )}

      <div className="space-y-3">
        {instances.map((instance) => (
          <InstanceCard
            key={instance.id}
            instance={instance}
            schoolId={schoolId}
            schoolName={schoolName}
            currentVolunteerId={currentVolunteerId}
            isSchoolMember={isSchoolMember}
            isRegularCommitment={regularSlotIds.has(instance.slot_id)}
          />
        ))}
      </div>
    </div>
  );
}
