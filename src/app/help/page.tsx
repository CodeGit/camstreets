import type { Metadata } from "next";
import HelpImage from "@/components/helpImage";

export const metadata: Metadata = {
  title: "How to volunteer - Cambridge School Streets",
  description: "A quick guide to signing up for school street patrol slots on camstreets.",
};

// A step number badge next to each heading - paired with each section being
// its own bordered/shadowed card (see the `rounded-xl border ... bg-card`
// sections below), so each step reads as a clearly separate block rather
// than a plain "N. Title" heading blending into a continuous scroll of text.
function StepHeading({ number, title }: { number: number | string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
        {number}
      </span>
      <h2 className="text-lg font-medium text-foreground">{title}</h2>
    </div>
  );
}

// A static how-to guide for new volunteers - linked from the footer's help
// icon (footer.tsx). Kept as plain prose sections rather than pulling in a
// markdown renderer, since the content is short, fixed, and only needs to
// live in one place.
export default function HelpPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">How to volunteer</h1>
        <p className="text-muted-foreground">
          A quick guide to using camstreets to sign up for school street patrol slots.
        </p>
      </div>

      <section className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-sm">
        <StepHeading number={1} title="Sign in" />
        <p>
          Go to the site and click <strong>Sign in</strong>. Enter your email address and click{" "}
          <strong>Send magic link</strong> - there&apos;s no password to remember. Check your email for a sign-in
          link and click it; that&apos;s it, you&apos;re in.
        </p>
        <HelpImage
          src="/help/sign-in-component-1.1.png"
          alt="The camstreets home page for a signed-out visitor, with a Sign in button"
          width={726}
          height={266}
        />
        <HelpImage
          src="/help/sign-in-email-1.2.png"
          alt="The sign-in email from Camstreets, with a Sign in link and a note that it expires in 24 hours"
          width={1049}
          height={351}
        />
        <p className="text-sm text-muted-foreground">
          The link is single-use and works only in the browser you requested it from. If your email app opens links
          in its own built-in browser, copy the link and paste it into your usual browser instead. If it still
          doesn&apos;t work, go back and request a new one.
        </p>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-sm">
        <StepHeading number={2} title="Find your school" />
        <p>
          Once you&apos;re signed in, use the <strong>View timetable</strong>&nbsp;dropdown in the top bar to pick a
          school. This takes you to that school&apos;s public weekly timetable. You can view barrier locations
          and times which still need volunteers.
        </p>
        <HelpImage
          src="/help/select-school-dropdown-2.1.png"
          alt="The View timetable dropdown open, listing several schools to choose from"
          width={622}
          height={309}
        />
        <HelpImage
          src="/help/default-week-timetable-2.2.png"
          alt="A school's weekly timetable, showing crossing locations and times, coloured by how well-staffed each slot is"
          width={2545}
          height={889}
        />
        <p>
          You can browse and change schools this way at any time, whether or not you&apos;ve signed up to volunteer
          for them yet.
        </p>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-sm">
        <StepHeading number={3} title="Sign up for a slot" />
        <p>Click any slot that still needs volunteers. A dialog opens where you choose:</p>
        <HelpImage
          src="/help/sign-up-3.1.png"
          alt="The sign-up dialog for a slot, with a choice between a one-off date and a regular weekly commitment"
          width={765}
          height={537}
        />
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>One-off - just this date</strong> - covers only the date you clicked.
          </li>
          <li>
            <strong>Regular - every week for the rest of the academic year</strong> - signs you up for that same
            slot every week, including future terms, until you cancel.
          </li>
        </ul>
        <p>
          Click <strong>OK</strong>&nbsp; to confirm. If this is the first time you&apos;ve signed up at this school,
          you&apos;re automatically added as a volunteer there too - you&apos;ll see a note to that effect before
          confirming.
        </p>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-sm">
        <StepHeading number={4} title="Changing your mind" />
        <p>Click a slot you&apos;re already signed up for to open the same dialog again.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            If it&apos;s a one-off signup, you&apos;ll see <strong>Remove this signup?</strong> with a single{" "}
            <strong>Remove signup</strong> button.
          </li>
          <li>
            If it looks like an ongoing regular commitment (you&apos;re confirmed for two or more dates on that same
            slot), you&apos;ll instead be asked to choose <strong>Just this date</strong> or{" "}
            <strong>This and all future dates</strong> before confirming with <strong>Remove</strong>.
          </li>
        </ul>
        <HelpImage
          src="/help/cancel-one-off-sign-in-4.1.png"
          alt="The Remove this signup? dialog for a one-off signup, with a single Remove signup button"
          width={750}
          height={361}
        />
        <HelpImage
          src="/help/cancel-regular-sign-in-4.2.png"
          alt="The Remove this signup? dialog for a regular commitment, with a choice between just this date and this and all future dates"
          width={732}
          height={477}
        />
        <p>
          Click <strong>Keep it</strong> at any point to close the dialog without changing anything.
        </p>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-sm">
        <StepHeading number={5} title="Your calendar" />
        <p>
          Click <strong>Dashboard</strong> in the top bar to see everything you&apos;ve signed up for, across all
          your schools, in one place. There are four views:
        </p>
        <HelpImage
          src="/help/dashboard-5.1png.png"
          alt="The Dashboard button in the top bar, next to Log out"
          width={460}
          height={73}
        />
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Day</strong> and <strong>Week</strong> - the detail view for a specific date range.
          </li>
          <li>
            <strong>Month</strong> - a compact grid, good for an at-a-glance view of a whole month.
          </li>
          <li>
            <strong>Term</strong> - a list of your upcoming commitments for the current term.
          </li>
        </ul>
        <HelpImage
          src="/help/calendar-day-5.2.png"
          alt="The Day view of the dashboard calendar, listing each slot for a single date"
          width={529}
          height={1130}
        />
        <HelpImage
          src="/help/calendar-monthly-5.2.png"
          alt="The Month view of the dashboard calendar, showing a compact grid of every day's slots for the month"
          width={2338}
          height={941}
        />
        <p>
          If you volunteer at more than one school, a school selector appears here too, letting you switch which
          school&apos;s slots you&apos;re looking at without leaving the dashboard.
        </p>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-sm">
        <StepHeading number={6} title="Subscribe to your calendar" />
        <p>
          At the top of the dashboard is a <strong>Subscribe to your own calendar</strong> link. Copy it into your
          phone&apos;s or computer&apos;s calendar app (as a subscribed/internet calendar, not a one-off import) and
          your confirmed slots will show up there automatically, staying in sync as you sign up for or cancel slots.
        </p>
        <HelpImage
          src="/help/subscribe-6.1.png"
          alt="The Subscribe to your own calendar link on the dashboard, with Copy link and Regenerate link buttons"
          width={2348}
          height={140}
        />
        <HelpImage
          src="/help/subscribe-6.2.png"
          alt="A calendar app's Subscribe to calendar / From URL menu, where the copied link can be pasted in"
          width={414}
          height={350}
        />
        <p>
          If you ever need to invalidate that link - for example, you shared it by mistake - click{" "}
          <strong>Regenerate link</strong> to get a fresh one; the old link stops working immediately.
        </p>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-sm">
        <StepHeading number={7} title="Updating your name" />
        <p>
          Your name (shown to other volunteers and admins) appears next to <strong>Welcome</strong> on your
          dashboard. Click <strong>Edit</strong> beside it to change it, then <strong>Save</strong>.
        </p>
        <HelpImage
          src="/help/name-edit-7.1.png"
          alt="The Welcome heading with the name field open for editing, plus Save and Cancel buttons"
          width={842}
          height={101}
        />
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-medium text-foreground">Need help?</h2>
        <p>
          If something isn&apos;t working as described above, or you&apos;ve got a question this guide doesn&apos;t
          cover, email{" "}
          <a href="mailto:help@camstreets.org" className="text-primary underline-offset-4 hover:underline">
            help@camstreets.org
          </a>
          .
        </p>
      </section>
    </div>
  );
}
