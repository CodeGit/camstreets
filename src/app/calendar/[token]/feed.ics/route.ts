import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { buildVolunteerCalendarFeed, type FeedSignup } from "@/lib/ics";

const MIN_REFRESH_INTERVAL_MS = 60_000;

// Public, unauthenticated endpoint a phone/Google/Outlook calendar
// subscribes to directly (no session, no cookies) - see TODO.md's
// "calendar integration" item and volunteer_calendar_feeds' migration
// comment for why this needs the service-role client just to resolve
// token -> volunteer_id, and why the rate limit lives here rather than on
// some shared infra.
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createServiceRoleClient();

  const { data: feed } = await supabase
    .from("volunteer_calendar_feeds")
    .select("volunteer_id, last_fetched_at")
    .eq("token", token)
    .maybeSingle();

  if (!feed) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (feed.last_fetched_at && Date.now() - new Date(feed.last_fetched_at).getTime() < MIN_REFRESH_INTERVAL_MS) {
    return new NextResponse("Too many requests - try again shortly", {
      status: 429,
      headers: { "Retry-After": "60" },
    });
  }

  await supabase
    .from("volunteer_calendar_feeds")
    .update({ last_fetched_at: new Date().toISOString() })
    .eq("token", token);

  // signups/slot_instances/slots/locations/schools are all already
  // publicly readable (same RLS a visitor gets on a school's public
  // calendar page) - service_role here is purely to bypass volunteers'
  // own RLS-scoped access, not because this data needs elevated
  // privileges to read.
  const { data: signups } = await supabase
    .from("signups")
    .select(
      `slot_instance:slot_instances (
        id, date, start_time, end_time,
        slot:slots ( location:locations ( name, school:schools ( name ) ) )
      )`
    )
    .eq("volunteer_id", feed.volunteer_id)
    .eq("status", "confirmed")
    .returns<FeedSignup[]>();

  const ics = buildVolunteerCalendarFeed(signups ?? []);

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="camstreets.ics"',
      "Cache-Control": "no-cache",
    },
  });
}
