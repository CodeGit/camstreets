import type { Tables } from "@/lib/supabase/database.types";
import WelcomeHeading from "@/components/dashboards/welcomeHeading";

type Volunteer = Tables<"volunteers">;

export default function VolunteerDashboard({ volunteer }: { volunteer: Volunteer | null }) {
  return (
    <div className="p-4 space-y-4">
      <WelcomeHeading volunteer={volunteer} />
      <p className="text-muted-foreground">
        Your upcoming slots will show up here soon.
      </p>
    </div>
  );
}
