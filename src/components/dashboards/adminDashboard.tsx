import { createClient } from "@/lib/supabase/server";
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/ui/tabs";
import type { Tables } from "@/lib/supabase/database.types";
import WelcomeHeading from "@/components/dashboards/welcomeHeading";
import SchoolList from "../schools/schoolList";
import VolunteerList from "../schools/volunteerList";
import TermTimes from "../schools/termTimes";

type Volunteer = Tables<"volunteers">;

export default async function AdminDashboard({
  volunteer,
  selectedSchoolId,
  volunteerListError,
}: {
  volunteer: Volunteer;
  selectedSchoolId?: number;
  volunteerListError?: string;
}) {
  const supabase = await createClient();
  const { data: schools } = await supabase
    .from("schools")
    .select("*, school_admins!inner(*)")
    .eq("school_admins.volunteer_id", volunteer.id)
    .order("name");

  return (
    <div className="p-4 space-y-4">
      <WelcomeHeading volunteer={volunteer} />
      <h2 className="text-lg font-medium">Your schools</h2>
      <SchoolList schools={schools ?? []} />
      {selectedSchoolId && (
        <Tabs defaultValue="volunteers">
          <TabsList>
            <TabsTab value="volunteers">Volunteers</TabsTab>
            <TabsTab value="term-times">Term times</TabsTab>
          </TabsList>
          <TabsPanel value="volunteers">
            <VolunteerList schoolId={selectedSchoolId} error={volunteerListError} />
          </TabsPanel>
          <TabsPanel value="term-times">
            <TermTimes schoolId={selectedSchoolId} />
          </TabsPanel>
        </Tabs>
      )}
    </div>
  );
}
