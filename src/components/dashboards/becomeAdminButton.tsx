import { createClient } from "@/lib/supabase/server";
import { becomeDemoAdmin } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";

// dev.camstreets.org's public demo only - see becomeDemoAdmin's own
// comment (src/app/dashboard/actions.ts) for the two independent layers
// keeping this inert in production. Renders nothing at all (not just a
// disabled button) when the env var is unset, same reasoning as checking
// it again server-side in the action itself: never rely on a single,
// client-visible gate for a privilege-escalation feature. Dropped once
// into each of AdminDashboard/SuperuserDashboard/VolunteerDashboard next
// to <WelcomeHeading />, same pattern as MyCalendar, so it shows
// regardless of the viewer's current role.
export default async function BecomeAdminButton() {
  if (process.env.ALLOW_SELF_ELEVATE !== "true") {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return (
    <form action={becomeDemoAdmin}>
      <Button type="submit" variant="outline" size="sm">
        Become an admin (demo)
      </Button>
    </form>
  );
}
