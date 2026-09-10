import InstanceCard, { type ScheduleInstance } from "./instanceCard";

function isAfternoon(startTime: string) {
  return startTime >= "12:00";
}

// One day's compact swatch grid within the month view (monthGrid.tsx) -
// morning above afternoon, one swatch per location side by side within
// each (start time + location as truncated text, colour-coded by status -
// see instanceCard.tsx's "swatch" variant), the same session/location
// shape as the week grid (week.tsx) just shrunk down so a whole month
// fits on screen. `morningLocationIds`/`afternoonLocationIds` are the
// full location lists for the WHOLE month (not just this day), passed in
// by the caller so every day's cell lines up under the same columns even
// when a particular day is missing one.
export default function MonthDayCell({
  dayNumber,
  active,
  instances,
  morningLocationIds,
  afternoonLocationIds,
  schoolId,
  schoolName,
  currentVolunteerId,
  isSchoolMember,
  regularSlotIds,
}: {
  dayNumber: number;
  active: boolean;
  instances: ScheduleInstance[];
  morningLocationIds: number[];
  afternoonLocationIds: number[];
  schoolId: number;
  schoolName: string;
  currentVolunteerId: string | null;
  isSchoolMember: boolean;
  regularSlotIds: Set<number>;
}) {
  if (!active) {
    return (
      <div className="min-h-14 rounded-md border border-border/50 bg-muted/20 p-1">
        <span className="text-xs text-muted-foreground/60">{dayNumber}</span>
      </div>
    );
  }

  function swatchRow(locationIds: number[], afternoonRow: boolean) {
    if (locationIds.length === 0) return null;
    return (
      <div className="flex gap-1">
        {locationIds.map((locationId) => {
          const instance = instances.find(
            (i) => i.slot.location.id === locationId && isAfternoon(i.start_time) === afternoonRow
          );
          return instance ? (
            <InstanceCard
              key={locationId}
              instance={instance}
              schoolId={schoolId}
              schoolName={schoolName}
              currentVolunteerId={currentVolunteerId}
              isSchoolMember={isSchoolMember}
              isRegularCommitment={regularSlotIds.has(instance.slot_id)}
              variant="swatch"
            />
          ) : (
            <div key={locationId} className="min-w-0 flex-1" aria-hidden="true" />
          );
        })}
      </div>
    );
  }

  return (
    <div className="min-h-14 space-y-1 rounded-md border border-border p-1">
      <span className="text-xs font-medium">{dayNumber}</span>
      <div className="space-y-1">
        {swatchRow(morningLocationIds, false)}
        {swatchRow(afternoonLocationIds, true)}
      </div>
    </div>
  );
}
