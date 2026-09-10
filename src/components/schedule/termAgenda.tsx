import CalendarNav from "./calendarNav";
import InstanceCard, { type ScheduleInstance } from "./instanceCard";

function formatDayHeading(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

function formatSeasonHeading(name: string, startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const startLabel = start.toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });
  const endLabel = end.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  return `${name}: ${startLabel} – ${endLabel}`;
}

// The viewer's own confirmed slots for a whole term, agenda-style (one
// compact row per date) - "My calendar"'s "everything I'm committed to"
// option. The month/week views already cover "where else could I help";
// a whole term of everyone else's "Needs volunteers" rows on top of that
// was too much to scan, so this is deliberately just the viewer's own
// dates (instancesByDate is pre-filtered to those by
// schoolTermCalendar.tsx). Pure/presentational, same day/week split as
// day.tsx/week.tsx.
export default function TermAgenda({
  seasonName,
  seasonStartDate,
  seasonEndDate,
  prevSeasonStartDate,
  nextSeasonStartDate,
  instancesByDate,
  schoolId,
  schoolName,
  currentVolunteerId,
  isSchoolMember,
  regularSlotIds,
  extraParams,
}: {
  seasonName: string;
  seasonStartDate: string;
  seasonEndDate: string;
  prevSeasonStartDate: string | null;
  nextSeasonStartDate: string | null;
  instancesByDate: Map<string, ScheduleInstance[]>;
  schoolId: number;
  schoolName: string;
  currentVolunteerId: string | null;
  isSchoolMember: boolean;
  regularSlotIds: Set<number>;
  // Other query params (e.g. which school/view a dashboard tab has
  // selected) that the prev/next term links need to preserve - see
  // week.tsx's own extraParams comment for the same gap this closes.
  extraParams?: Record<string, string>;
}) {
  const hrefForDate = (targetDate: string) =>
    `?${new URLSearchParams({ ...extraParams, date: targetDate }).toString()}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">{formatSeasonHeading(seasonName, seasonStartDate, seasonEndDate)}</h2>
        <CalendarNav
          prevHref={prevSeasonStartDate ? hrefForDate(prevSeasonStartDate) : null}
          nextHref={nextSeasonStartDate ? hrefForDate(nextSeasonStartDate) : null}
          prevLabel="Previous term"
          nextLabel="Next term"
        />
      </div>

      {instancesByDate.size === 0 ? (
        <p className="text-muted-foreground">
          You haven&apos;t signed up for anything this term yet.
        </p>
      ) : (
        <div className="space-y-4">
          {[...instancesByDate.entries()].map(([dateStr, dayInstances]) => (
            <div key={dateStr}>
              <h3 className="mb-1 text-sm font-medium text-muted-foreground">{formatDayHeading(dateStr)}</h3>
              <div className="space-y-1">
                {dayInstances.map((instance) => (
                  <InstanceCard
                    key={instance.id}
                    instance={instance}
                    schoolId={schoolId}
                    schoolName={schoolName}
                    currentVolunteerId={currentVolunteerId}
                    isSchoolMember={isSchoolMember}
                    isRegularCommitment={regularSlotIds.has(instance.slot_id)}
                    variant="agenda"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
