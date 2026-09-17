import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to volunteer - Cambridge School Streets",
  description: "A quick guide to signing up for school street patrol slots on camstreets.",
};

// A static how-to guide for new volunteers - linked from the footer's help
// icon (footer.tsx). Kept as plain prose sections rather than pulling in a
// markdown renderer, since the content is short, fixed, and only needs to
// live in one place.
export default function HelpPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">How to volunteer</h1>
        <p className="text-muted-foreground">
          A quick guide to using camstreets to sign up for school street patrol slots.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-medium text-foreground">1. Sign in</h2>
        <p>
          Go to the site and click <strong>Sign in</strong>. Enter your email address and click{" "}
          <strong>Send magic link</strong> - there&apos;s no password to remember. Check your email for a sign-in
          link and click it; that&apos;s it, you&apos;re in.
        </p>
        <p className="text-sm text-muted-foreground">
          The link is single-use and works only in the browser you requested it from, so if it doesn&apos;t work,
          just go back and request a new one.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium text-foreground">2. Find your school</h2>
        <p>
          Once you&apos;re signed in, use the <strong>View timetable</strong>&nbsp;dropdown in the top bar to pick a
          school. This takes you to that school&apos;s public weekly timetable. You can view barrier locations 
          and times which still need volunteers.
        </p>
        <p>
          You can browse and change schools this way at any time, whether or not you&apos;ve signed up to volunteer
          for them yet.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium text-foreground">3. Sign up for a slot</h2>
        <p>Click any slot that still needs volunteers. A dialog opens where you choose:</p>
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
    
    <section className="space-y-2">
        <h2 className="text-lg font-medium text-foreground">4. Changing your mind</h2>
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
        <p>
          Click <strong>Keep it</strong> at any point to close the dialog without changing anything.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium text-foreground">5. Your calendar</h2>
        <p>
          Click <strong>Dashboard</strong> in the top bar to see everything you&apos;ve signed up for, across all
          your schools, in one place. There are four views:
        </p>
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
        <p>
          If you volunteer at more than one school, a school selector appears here too, letting you switch which
          school&apos;s slots you&apos;re looking at without leaving the dashboard.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium text-foreground">6. Subscribe to your calendar</h2>
        <p>
          At the top of the dashboard is a <strong>Subscribe to your own calendar</strong> link. Copy it into your
          phone&apos;s or computer&apos;s calendar app (as a subscribed/internet calendar, not a one-off import) and
          your confirmed slots will show up there automatically, staying in sync as you sign up for or cancel slots.
        </p>
        <p>
          If you ever need to invalidate that link - for example, you shared it by mistake - click{" "}
          <strong>Regenerate link</strong> to get a fresh one; the old link stops working immediately.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium text-foreground">7. Updating your name</h2>
        <p>
          Your name (shown to other volunteers and admins) appears next to <strong>Welcome</strong> on your
          dashboard. Click <strong>Edit</strong> beside it to change it, then <strong>Save</strong>.
        </p>
      </section>

      <section className="space-y-2 border-t border-border pt-6">
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
