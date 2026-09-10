import type { Tables } from "@/lib/supabase/database.types";
import WelcomeHeading from "@/components/dashboards/welcomeHeading";
import MyCalendar from "./myCalendar";
import BecomeAdminButton from "./becomeAdminButton";

type Volunteer = Tables<"volunteers">;

export default function VolunteerDashboard({
  volunteer,
  selectedSchoolId,
  date,
  view,
}: {
  volunteer: Volunteer | null;
  selectedSchoolId?: number;
  date?: string;
  view?: string;
}) {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <WelcomeHeading volunteer={volunteer} />
        <BecomeAdminButton />
      </div>
      {volunteer && (
        <MyCalendar volunteerId={volunteer.id} selectedSchoolId={selectedSchoolId} date={date} view={view} />
      )}
    </div>
  );
}
