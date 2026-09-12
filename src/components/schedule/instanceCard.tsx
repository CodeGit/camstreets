import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogPopup,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Tables } from "@/lib/supabase/database.types";
import { claimSlot, cancelSignup } from "./actions";
import { volunteerBadgeClass } from "@/lib/volunteerColor";

export type ScheduleInstance = Tables<"slot_instances"> & {
  slot: Tables<"slots"> & {
    location: Tables<"locations">;
  };
  signups: (Tables<"signups"> & {
    volunteer: Tables<"volunteers">;
  })[];
};

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

// Shared by the day and week views - a single slot instance's coverage
// status, avatar circles, and (for a signed-in viewer) a dialog to sign up
// or cancel. `variant="card"` is the full card (day view); `variant="block"`
// is a small colour-coded bar sized/positioned by the caller (the week
// view's time grid) - same dialog underneath either way.
export default function InstanceCard({
  instance,
  schoolId,
  schoolName,
  currentVolunteerId,
  isSchoolMember,
  isRegularCommitment,
  dimUnclaimed = false,
  variant = "card",
}: {
  instance: ScheduleInstance;
  schoolId: number;
  schoolName: string;
  currentVolunteerId: string | null;
  isSchoolMember: boolean;
  isRegularCommitment: boolean;
  // Only true on the dashboard's "My calendar" week view, where the point
  // is "what have I committed to" and everything else should visually
  // recede. On the public school page, the same week grid shows everyone's
  // coverage as equally relevant - there's no "mine" for a visitor to
  // contrast against, and even a signed-in viewer browsing someone else's
  // commitments shouldn't see them all faded.
  dimUnclaimed?: boolean;
  // "card": full day-view card with avatar circles. "block": compact week-
  // grid cell with name badges. "agenda": a single-line row for a whole
  // term's worth of dates (termAgenda.tsx) - status/capacity only, no
  // names, since a term has far more dates than a week and needs to stay
  // scannable rather than trying to show everyone. "swatch": the month
  // grid's tiniest cell (monthDayCell.tsx) - just start time + location on
  // one truncated line, colour-coded by status; no names, no capacity
  // text (the fill colour already carries that).
  variant?: "card" | "block" | "agenda" | "swatch";
}) {
  const confirmed = instance.signups.filter((s) => s.status === "confirmed");
  const status =
    confirmed.length >= instance.capacity ? "staffed" : confirmed.length > 0 ? "partial" : "open";
  const statusLabel =
    status === "staffed"
      ? "Fully staffed"
      : status === "partial"
        ? "Needs more volunteers"
        : "Needs volunteers";
  const myConfirmedSignup = currentVolunteerId
    ? confirmed.find((s) => s.volunteer_id === currentVolunteerId)
    : undefined;

  const claimAction = claimSlot.bind(null, instance.id, schoolId);
  const cancelAction = cancelSignup.bind(null, instance.id, schoolId);

  // Plain-text form for aria-label (HTML tags would just be read out as
  // literal characters there). The dialog description below needs actual
  // multiline output instead, built as JSX further down.
  const summaryText = `${instance.slot.location.name}, ${formatDate(instance.date)}, ${instance.start_time.slice(0, 5)}–${instance.end_time.slice(0, 5)}`;
  // DialogDescription itself renders a <p> (see ui/dialog.tsx), so block
  // elements like <p> can't be nested inside it - <br /> line breaks stay
  // valid HTML while still giving two visual lines (location, then
  // date/time). The en-dash inside the time range is a genuine range;
  // the comma joining date to it is just a detail separator.
  const summaryLines = (
    <>
      {instance.slot.location.name}
      <br />
      {formatDate(instance.date)}, {instance.start_time.slice(0, 5)}–{instance.end_time.slice(0, 5)}
    </>
  );

  const isBlock = variant === "block";
  const isAgenda = variant === "agenda";
  const isSwatch = variant === "swatch";

  const statusBgClass =
    status === "staffed" ? "bg-staffed-bg" : status === "partial" ? "bg-partial-bg" : "bg-open-bg";
  const statusTextClass =
    status === "staffed" ? "text-staffed" : status === "partial" ? "text-partial" : "text-open";

  const blockContent = (
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

  // No names here (see the variant comment above) - just enough to say
  // "this slot exists, this is its state" so a whole term stays scannable.
  const agendaContent = (
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

  // The month grid's tightest variant - just enough to identify the slot
  // at a glance without opening it: start time and location, truncated to
  // one line. No status/capacity text (the fill colour already carries
  // that, same as before) and no names, for the same scannability reason
  // as the agenda.
  const swatchContent = (
    <span className="block truncate">
      {instance.start_time.slice(0, 5)} {instance.slot.location.name}
    </span>
  );

  // Status is shown as visible text on the block/agenda too now, but the
  // aria-label still restates it alongside the date (which isn't shown on
  // the block itself, and is only shown once per day group in the agenda)
  // - a screen reader announces the whole button in one go rather than
  // needing to parse several separate text nodes.
  const compactAriaLabel = `${summaryText}, ${statusLabel}`;

  const cardContent = (
    <>
      <div className="min-w-0">
        <div className="truncate font-medium">{instance.slot.location.name}</div>
        <div className="text-sm text-muted-foreground">
          {instance.start_time.slice(0, 5)}–{instance.end_time.slice(0, 5)}
        </div>
      </div>
      <div className="flex items-center gap-3">
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
    </>
  );

  const statusBorderClass =
    status === "staffed" ? "border-staffed" : status === "partial" ? "border-partial" : "border-open";
  const isMine = !!myConfirmedSignup;
  // block, agenda and swatch share the same colour-coded look and
  // aria-labelling; card is the odd one out (full-width, its own content
  // already spells everything out visually).
  const isCompact = isBlock || isAgenda || isSwatch;
  // Only dim relative to the viewer's *own* slots, and only in the week
  // grid (isBlock) on the dashboard's "My calendar" view (dimUnclaimed) -
  // never for an anonymous visitor (there's no "mine" to contrast
  // against), never on the public school page (see the dimUnclaimed
  // comment above), and not in the agenda/swatch views, where a still-
  // open slot is the whole point of showing it (see the variant comment
  // above) rather than something to visually recede.
  const shouldDim = isBlock && dimUnclaimed && !!currentVolunteerId && !isMine;

  // Base look is identical whether or not this ends up clickable; only the
  // hover/focus affordance differs (added below for signed-in viewers). A
  // slot the viewer is themselves signed up for additionally gets a bold
  // all-round outline in a fixed, non-status colour (outline-foreground,
  // not a darker shade of the status hue - a same-family darker outline
  // read as "a slightly bolder box", not as a distinct claimed marker),
  // plus a shadow except on the swatch (many sit close together in the
  // month grid, where a shadow per cell just looks noisy) - on top of the
  // normal look. In the week grid every other slot also fades back a bit,
  // so the viewer's own commitments stand out at a glance. Additive rather
  // than replacing border-l-4/border-border, since several e2e specs
  // locate cards by that base class and would otherwise stop matching the
  // moment a test signs the viewer up for the very slot it's about to
  // re-locate.
  const emphasisClasses = isMine
    ? `outline outline-2 -outline-offset-2 outline-foreground ${isSwatch ? "" : "shadow-md"}`
    : shouldDim
      ? "opacity-45"
      : "";
  const baseClasses = isSwatch
    ? `min-w-0 flex-1 truncate rounded-sm border px-1 py-0.5 text-left text-[10px] leading-tight ${statusBgClass} ${statusBorderClass} ${statusTextClass} ${emphasisClasses}`
    : isCompact
      ? `w-full overflow-hidden rounded-md border-l-4 text-left ${statusBgClass} ${statusBorderClass} ${
          isAgenda ? "flex items-center px-2 py-1.5" : "px-1.5 py-1"
        } ${emphasisClasses}`
      : `flex w-full items-center justify-between rounded-lg border border-border p-4 text-left ${emphasisClasses}`;
  // Dimmed slots still brighten to full opacity on hover/focus so they
  // don't read as disabled - they're still clickable, just visually
  // receded until attention is on them.
  const interactiveClasses = isCompact
    ? `transition-opacity hover:opacity-80 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`
    : `transition-[opacity,colors] hover:opacity-100 hover:border-primary hover:bg-muted/40 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`;
  const content = isBlock ? blockContent : isAgenda ? agendaContent : isSwatch ? swatchContent : cardContent;

  if (!currentVolunteerId) {
    return (
      <div className={baseClasses} aria-label={isCompact ? compactAriaLabel : undefined}>
        {content}
      </div>
    );
  }

  return (
    <Dialog>
      <DialogTrigger
        className={`${baseClasses} ${interactiveClasses}`}
        aria-label={isCompact ? compactAriaLabel : undefined}
      >
        {content}
      </DialogTrigger>
      <DialogPopup>
        {myConfirmedSignup ? (
          isRegularCommitment ? (
            <form action={cancelAction} className="space-y-4">
              <DialogTitle>Cancel this signup?</DialogTitle>
              <DialogDescription>{summaryLines}</DialogDescription>
              <div className="space-y-2 text-sm">
                <label className="flex items-center gap-2">
                  <input type="radio" name="cancellation_type" value="one_off" defaultChecked />
                  Just this date
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="cancellation_type" value="regular" />
                  This and all future dates
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose type="button" className={buttonVariants({ variant: "outline" })}>
                  Keep it
                </DialogClose>
                <DialogClose type="submit" render={<Button variant="destructive">Cancel</Button>} />
              </div>
            </form>
          ) : (
            <>
              <DialogTitle>Cancel this signup?</DialogTitle>
              <DialogDescription>{summaryLines}</DialogDescription>
              <div className="flex justify-end gap-2">
                <DialogClose type="button" className={buttonVariants({ variant: "outline" })}>
                  Keep it
                </DialogClose>
                <form action={cancelAction}>
                  <DialogClose type="submit" render={<Button variant="destructive">Cancel signup</Button>} />
                </form>
              </div>
            </>
          )
        ) : (
          <form action={claimAction} className="space-y-4">
            <DialogTitle>Sign up</DialogTitle>
            <DialogDescription>{summaryLines}</DialogDescription>
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" name="commitment_type" value="one_off" defaultChecked />
                One-off - just this date
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="commitment_type" value="regular" />
                Regular - every week for the rest of the academic year
              </label>
            </div>
            {!isSchoolMember && (
              <p className="text-sm text-muted-foreground">
                You&apos;ll also be added as a volunteer for {schoolName}.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <DialogClose type="button" className={buttonVariants({ variant: "outline" })}>
                Cancel
              </DialogClose>
              <DialogClose type="submit" render={<Button>OK</Button>} />
            </div>
          </form>
        )}
      </DialogPopup>
    </Dialog>
  );
}
