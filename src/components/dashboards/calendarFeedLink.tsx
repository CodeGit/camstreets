import { createClient } from "@/lib/supabase/server";
import { getOrigin } from "@/lib/origin";
import { regenerateCalendarFeedToken } from "@/app/dashboard/actions";
import SubmitButton from "@/components/ui/submitButton";
import CopyLinkButton from "./copyLinkButton";

// A stable, per-volunteer subscribe URL for their own confirmed slots
// (see src/app/calendar/[token]/feed.ics and TODO.md's "calendar
// integration" item) - lives once per volunteer, not per school, since
// one feed already covers every school they've signed up at. Rendered
// once at the top of "My calendar" regardless of which day/week/month/
// term view or school is currently selected.
export default async function CalendarFeedLink() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // A pure read - the row is provisioned automatically the moment a
  // volunteer is created (see the on_volunteer_created trigger,
  // 20260916213125_create_calendar_feed_on_volunteer_insert.sql), so this
  // component no longer needs a lazy insert-if-missing fallback. `!feed`
  // should only ever happen for a volunteer somehow predating both that
  // trigger and its one-time backfill.
  const { data: feed } = await supabase
    .from("volunteer_calendar_feeds")
    .select("token")
    .eq("volunteer_id", user.id)
    .maybeSingle();

  if (!feed) {
    return null;
  }

  const url = `${await getOrigin()}/calendar/${feed.token}/feed.ics`;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
      <span className="text-muted-foreground">Subscribe to your own calendar:</span>
      <code className="min-w-0 flex-1 truncate rounded bg-background px-2 py-1 text-xs">{url}</code>
      <CopyLinkButton value={url} />
      <form action={regenerateCalendarFeedToken}>
        <SubmitButton variant="ghost" size="sm" pendingText="Regenerating...">
          Regenerate link
        </SubmitButton>
      </form>
    </div>
  );
}
