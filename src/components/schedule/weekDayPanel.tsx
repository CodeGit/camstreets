import InstanceCard, { type ScheduleInstance } from "./instanceCard";

function formatDayHeading(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

// One day's worth of full-width "detailed" instances, for the mobile
// swipe-per-day carousel in week.tsx (below the `sm` breakpoint, where the
// 5-column grid stops fitting). Deliberately the plain "detailed" variant,
// not "labeled" - at full mobile width there's room for the same legible
// layout day.tsx already uses, rather than the grid's cramped, truncated
// cells.
// No prev/next nav of its own (unlike day.tsx) since the swipe gesture
// itself is the navigation here, with the week-level prev/next in
// week.tsx's own heading still covering "jump to a different week".
export default function WeekDayPanel({
  date,
  hasTerm,
  instances,
  schoolId,
  schoolName,
  currentVolunteerId,
  isSchoolMember,
  regularSlotIds,
  dimUnclaimed = false,
}: {
  date: string;
  hasTerm: boolean;
  instances: ScheduleInstance[];
  schoolId: number;
  schoolName: string;
  currentVolunteerId: string | null;
  isSchoolMember: boolean;
  regularSlotIds: Set<number>;
  dimUnclaimed?: boolean;
}) {
  return (
    // 92% width rather than a full 100% - the next day's edge peeks in on
    // the right as a visual hint that this carousel actually swipes,
    // rather than looking like a single static page.
    <div className="w-[92%] shrink-0 snap-start space-y-3 px-1">
      <h3 className="text-base font-medium">{formatDayHeading(date)}</h3>
      {!hasTerm && <p className="text-sm text-muted-foreground">No term covers this date.</p>}
      {hasTerm && instances.length === 0 && (
        <p className="text-sm text-muted-foreground">No crossing patrol slots scheduled for this day.</p>
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
            dimUnclaimed={dimUnclaimed}
          />
        ))}
      </div>
    </div>
  );
}
