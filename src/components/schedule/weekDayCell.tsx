import InstanceCard, { type ScheduleInstance } from "./instanceCard";

// One day's slots for a single session (morning/afternoon) within the week
// grid - locations laid out side by side, or a "no term" note when the
// date falls outside any term. Extracted from week.tsx so the grid
// skeleton stays focused on layout and this on what a single cell shows.
export default function WeekDayCell({
  hasTerm,
  instances,
  locationIds,
  schoolId,
  schoolName,
  currentVolunteerId,
  isSchoolMember,
  regularSlotIds,
  dimUnclaimed = false,
}: {
  hasTerm: boolean;
  instances: ScheduleInstance[];
  locationIds: number[];
  schoolId: number;
  schoolName: string;
  currentVolunteerId: string | null;
  isSchoolMember: boolean;
  regularSlotIds: Set<number>;
  dimUnclaimed?: boolean;
}) {
  if (!hasTerm) {
    return <p className="text-xs text-muted-foreground">No term covers this date.</p>;
  }
  if (locationIds.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {locationIds.map((locationId) => {
        const instancesHere = instances.filter((instance) => instance.slot.location.id === locationId);
        return (
          <div key={locationId} className="min-w-0 space-y-1">
            {instancesHere.map((instance) => (
              <InstanceCard
                key={instance.id}
                instance={instance}
                schoolId={schoolId}
                schoolName={schoolName}
                currentVolunteerId={currentVolunteerId}
                isSchoolMember={isSchoolMember}
                isRegularCommitment={regularSlotIds.has(instance.slot_id)}
                dimUnclaimed={dimUnclaimed}
                variant="block"
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
