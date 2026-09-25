import type { ScheduleInstance } from "./instanceCard";
import { volunteerBadgeClass } from "@/lib/volunteerColor";

// The four ways a single slot instance's status/coverage gets rendered,
// extracted out of instanceCard.tsx so that file's own job shrinks to
// "work out the derived state and run the dialog and actions" rather
// than also owning every variant's markup. Each takes only the props it
// actually needs (GlanceVariant barely needs anything) rather than sharing
// one wide props shape - deliberately, so a given variant's own contract
// says exactly what it depends on.
//
// Named for how much information each one shows, most to least - one
// consistent scale rather than each being named for its own shape.

type StatusProps = {
  statusLabel: string;
  statusTextClass: string;
  confirmed: ScheduleInstance["signups"];
};

// Full day-view card - status pill plus one avatar circle per capacity
// slot. A vertical stack, not a two-column split - the status pill and
// avatar circles used to sit on their own right-hand column alongside the
// location/time, which overlapped once the card got narrow enough (the
// mobile week-day carousel, a narrow "day" view, etc). flex-wrap on the
// status+avatars row means that even that combination drops to its own
// second line rather than overlapping if it ever runs out of room too.
export function DetailedVariant({
  instance,
  statusLabel,
  statusBgClass,
  statusTextClass,
  confirmed,
}: StatusProps & { instance: ScheduleInstance; statusBgClass: string }) {
  return (
    <div className="min-w-0 w-full space-y-2">
      <div className="min-w-0">
        <div className="truncate font-medium">{instance.slot.location.name}</div>
        <div className="text-sm text-muted-foreground">
          {instance.start_time.slice(0, 5)}–{instance.end_time.slice(0, 5)}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBgClass} ${statusTextClass}`}>
          {statusLabel}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: instance.capacity }).map((_, i) => {
            const signup = confirmed[i];
            return signup ? (
              <span
                key={i}
                title={signup.volunteer.display_name}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ring-1 ring-inset ring-current/25 ${volunteerBadgeClass(signup.volunteer_id)}`}
              >
                {signup.volunteer.display_name[0]}
              </span>
            ) : (
              <span
                key={i}
                title="Needs a volunteer"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground"
              >
                +
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Compact week-grid cell - name badges rather than avatar circles (more
// legible at this size), status as a single trailing line.
export function LabeledVariant({ instance, statusLabel, statusTextClass, confirmed }: StatusProps & { instance: ScheduleInstance }) {
  return (
    <div className="min-w-0 space-y-0.5 leading-tight">
      <div className="truncate text-sm font-semibold">{instance.slot.location.name}</div>
      <div className="truncate text-xs text-muted-foreground">
        {instance.start_time.slice(0, 5)}–{instance.end_time.slice(0, 5)}
      </div>
      {confirmed.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {confirmed.map((s) => (
            <span
              key={s.id}
              className={`max-w-full truncate rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ring-current/25 ${volunteerBadgeClass(s.volunteer_id)}`}
            >
              {s.volunteer.display_name}
            </span>
          ))}
        </div>
      )}
      <div className={`truncate text-xs font-medium ${statusTextClass}`}>
        {statusLabel} ({confirmed.length}/{instance.capacity})
      </div>
    </div>
  );
}

// A single-line row for a whole term's worth of dates (termAgenda.tsx) -
// status/capacity only, no names, since a term has far more dates than a
// week and needs to stay scannable rather than trying to show everyone.
export function SummaryVariant({ instance, statusLabel, statusTextClass, confirmed }: StatusProps & { instance: ScheduleInstance }) {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
      <div className="flex min-w-0 items-baseline gap-2">
        <span className="truncate text-sm font-medium">{instance.slot.location.name}</span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {instance.start_time.slice(0, 5)}–{instance.end_time.slice(0, 5)}
        </span>
      </div>
      <span className={`shrink-0 text-xs font-medium ${statusTextClass}`}>
        {statusLabel} ({confirmed.length}/{instance.capacity})
      </span>
    </div>
  );
}

// The month grid's tiniest cell - just enough to identify the slot at a
// glance without opening it: start time and location, truncated to one
// line. No status/capacity text (the fill colour already carries that)
// and no names, for the same scannability reason as "summary".
export function GlanceVariant({ instance }: { instance: ScheduleInstance }) {
  return (
    <span className="block truncate">
      {instance.start_time.slice(0, 5)} {instance.slot.location.name}
    </span>
  );
}
