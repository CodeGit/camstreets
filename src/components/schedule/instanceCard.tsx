"use client";

import { useActionState, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogPopup,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import SubmitButton from "@/components/ui/submitButton";
import type { Tables } from "@/lib/supabase/database.types";
import { claimSlot, cancelSignup } from "./actions";
import { DetailedVariant, LabeledVariant, SummaryVariant, GlanceVariant } from "./instanceCardContent";

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
// or cancel. `variant="detailed"` is the full card (day view);
// `variant="labeled"` is a small colour-coded bar sized/positioned by the
// caller (the week view's time grid) - same dialog underneath either way.
//
// The four variant names are deliberately one consistent scale - how much
// information is shown, most to least - rather than each being named for
// its own shape/metaphor (a "card", a "block", ...), which is what they
// used to be called and why they never read as a set.
export default function InstanceCard({
  instance,
  schoolId,
  schoolName,
  currentVolunteerId,
  isSchoolMember,
  isRegularCommitment,
  dimUnclaimed = false,
  variant = "detailed",
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
  // "detailed": full day-view card, avatar circles + status pill.
  // "labeled": compact week-grid cell, name badges + status text.
  // "summary": a single-line row for a whole term's worth of dates
  // (termAgenda.tsx) - status/count only, no names, since a term has far
  // more dates than a week and needs to stay scannable rather than trying
  // to show everyone. "glance": the month grid's tiniest cell
  // (monthDayCell.tsx) - just start time + location on one truncated
  // line, colour-coded by status; no names, no status text (the fill
  // colour already carries that).
  variant?: "detailed" | "labeled" | "summary" | "glance";
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

  // Controlled, rather than DialogClose's own click-triggered close: a
  // DialogClose button closes the instant it's clicked, well before an
  // async Server Action has actually finished - confirmed directly (a
  // throttled action still showed the dialog gone in well under 300ms).
  // On a slow connection that's a real gap with zero feedback that
  // anything is still happening. Wrapping each action in useActionState
  // and closing only once it resolves keeps the dialog (and its pending
  // spinner, via SubmitButton) visible for the action's actual duration.
  const [open, setOpen] = useState(false);
  const [, claimFormAction] = useActionState(async (_prev: null, formData: FormData) => {
    await claimAction(formData);
    setOpen(false);
    return null;
  }, null);
  const [, cancelFormAction] = useActionState(async (_prev: null, formData: FormData) => {
    await cancelAction(formData);
    setOpen(false);
    return null;
  }, null);

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

  const isLabeled = variant === "labeled";
  const isSummary = variant === "summary";
  const isGlance = variant === "glance";

  const statusBgClass =
    status === "staffed" ? "bg-staffed-bg" : status === "partial" ? "bg-partial-bg" : "bg-open-bg";
  const statusTextClass =
    status === "staffed" ? "text-staffed" : status === "partial" ? "text-partial" : "text-open";

  // Status is shown as visible text on labeled/summary too now, but the
  // aria-label still restates it alongside the date (which isn't shown on
  // "labeled" itself, and is only shown once per day group in "summary")
  // - a screen reader announces the whole button in one go rather than
  // needing to parse several separate text nodes.
  const compactAriaLabel = `${summaryText}, ${statusLabel}`;

  const statusBorderClass =
    status === "staffed" ? "border-staffed" : status === "partial" ? "border-partial" : "border-open";
  const isMine = !!myConfirmedSignup;
  // labeled, summary and glance share the same colour-coded look and
  // aria-labelling; detailed is the odd one out (full-width, its own
  // content already spells everything out visually).
  const isCompact = isLabeled || isSummary || isGlance;
  // Only dim relative to the viewer's *own* slots, and only in the week
  // grid (isLabeled) on the dashboard's "My calendar" view (dimUnclaimed)
  // - never for an anonymous visitor (there's no "mine" to contrast
  // against), never on the public school page (see the dimUnclaimed
  // comment above), and not in the summary/glance views, where a still-
  // open slot is the whole point of showing it (see the variant comment
  // above) rather than something to visually recede.
  const shouldDim = isLabeled && dimUnclaimed && !!currentVolunteerId && !isMine;

  // Base look is identical whether or not this ends up clickable; only the
  // hover/focus affordance differs (added below for signed-in viewers). A
  // slot the viewer is themselves signed up for additionally gets a bold
  // all-round outline in a fixed, non-status colour (outline-foreground,
  // not a darker shade of the status hue - a same-family darker outline
  // read as "a slightly bolder box", not as a distinct claimed marker),
  // plus a shadow except on "glance" (many sit close together in the
  // month grid, where a shadow per cell just looks noisy) - on top of the
  // normal look. In the week grid every other slot also fades back a bit,
  // so the viewer's own commitments stand out at a glance. Additive rather
  // than replacing border-l-4/border-border, since several e2e specs
  // locate cards by that base class and would otherwise stop matching the
  // moment a test signs the viewer up for the very slot it's about to
  // re-locate.
  const emphasisClasses = isMine
    ? `outline outline-2 -outline-offset-2 outline-foreground ${isGlance ? "" : "shadow-md"}`
    : shouldDim
      ? "opacity-45"
      : "";
  const baseClasses = isGlance
    ? `min-w-0 flex-1 truncate rounded-sm border px-1 py-0.5 text-left text-[10px] leading-tight ${statusBgClass} ${statusBorderClass} ${statusTextClass} ${emphasisClasses}`
    : isCompact
      ? `w-full overflow-hidden rounded-md border-l-4 text-left ${statusBgClass} ${statusBorderClass} ${
          isSummary ? "flex items-center px-2 py-1.5" : "px-1.5 py-1"
        } ${emphasisClasses}`
      : `flex w-full items-center rounded-lg border border-border p-4 text-left ${emphasisClasses}`;
  // Dimmed slots still brighten to full opacity on hover/focus so they
  // don't read as disabled - they're still clickable, just visually
  // receded until attention is on them.
  const interactiveClasses = isCompact
    ? `transition-opacity hover:opacity-80 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`
    : `transition-[opacity,colors] hover:opacity-100 hover:border-primary hover:bg-muted/40 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`;

  // Built once and reused both as the default ("detailed" variant) content
  // and as the glance tooltip's preview below - same as before this file's
  // four variants moved into instanceCardContent.tsx.
  const detailedVariantContent = (
    <DetailedVariant
      instance={instance}
      statusLabel={statusLabel}
      statusBgClass={statusBgClass}
      statusTextClass={statusTextClass}
      confirmed={confirmed}
    />
  );
  const content = isLabeled ? (
    <LabeledVariant instance={instance} statusLabel={statusLabel} statusTextClass={statusTextClass} confirmed={confirmed} />
  ) : isSummary ? (
    <SummaryVariant instance={instance} statusLabel={statusLabel} statusTextClass={statusTextClass} confirmed={confirmed} />
  ) : isGlance ? (
    <GlanceVariant instance={instance} />
  ) : (
    detailedVariantContent
  );

  // "glance" truncates to a single line (start time + location only, see
  // the variant comment above) - a hover tooltip reveals the same detail
  // the full "detailed" variant already shows (status, avatars) rather
  // than requiring a click just to see what it actually is.
  const withGlanceTooltip = (trigger: React.ReactElement) =>
    isGlance ? (
      <Tooltip>
        <TooltipTrigger render={trigger} />
        <TooltipContent>{detailedVariantContent}</TooltipContent>
      </Tooltip>
    ) : (
      trigger
    );

  if (!currentVolunteerId) {
    return withGlanceTooltip(
      <div className={baseClasses} aria-label={isCompact ? compactAriaLabel : undefined}>
        {content}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {withGlanceTooltip(
        <DialogTrigger
          className={`${baseClasses} ${interactiveClasses}`}
          aria-label={isCompact ? compactAriaLabel : undefined}
        >
          {content}
        </DialogTrigger>
      )}
      <DialogPopup>
        {myConfirmedSignup ? (
          isRegularCommitment ? (
            <form action={cancelFormAction} className="space-y-4">
              <DialogTitle>Remove this signup?</DialogTitle>
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
                <SubmitButton variant="destructive" pendingText="Removing...">
                  Remove
                </SubmitButton>
              </div>
            </form>
          ) : (
            <>
              <DialogTitle>Remove this signup?</DialogTitle>
              <DialogDescription>{summaryLines}</DialogDescription>
              <div className="flex justify-end gap-2">
                <DialogClose type="button" className={buttonVariants({ variant: "outline" })}>
                  Keep it
                </DialogClose>
                <form action={cancelFormAction}>
                  <SubmitButton variant="destructive" pendingText="Removing...">
                    Remove signup
                  </SubmitButton>
                </form>
              </div>
            </>
          )
        ) : (
          <form action={claimFormAction} className="space-y-4">
            <DialogTitle>Sign up</DialogTitle>
            <DialogDescription>{summaryLines}</DialogDescription>
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" name="commitment_type" value="one_off" defaultChecked />
                One-off - just this date
              </label>
              <label className="flex items-start gap-2">
                <input type="radio" name="commitment_type" value="regular" className="mt-1" />
                <span>
                  Regular - every{" "}
                  <select
                    name="frequency"
                    defaultValue="1"
                    className="mx-0.5 rounded-md border border-input bg-transparent px-1.5 py-0.5 text-sm"
                  >
                    <option value="1">week</option>
                    <option value="2">fortnight</option>
                  </select>{" "}
                  for the rest of the academic year
                </span>
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
              <SubmitButton pendingText="Signing up...">OK</SubmitButton>
            </div>
          </form>
        )}
      </DialogPopup>
    </Dialog>
  );
}
