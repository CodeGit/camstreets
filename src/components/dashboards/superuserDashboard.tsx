import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import WelcomeHeading from "@/components/dashboards/welcomeHeading";
import SchoolList from "../schools/schoolList";
import SchoolManagementTabs from "../schools/schoolManagementTabs";
import DefaultTerms from "../terms/defaultTerms";
import BankHolidays from "../terms/bankHolidays";

type Volunteer = Tables<"volunteers">;

export default async function SuperuserDashboard({
  volunteer,
  selectedSchoolId,
  volunteerListError,
}: {
  volunteer: Volunteer;
  selectedSchoolId?: number;
  volunteerListError?: string;
}) {
  const supabase = await createClient();
  const { data: schools } = await supabase.from("schools").select("*").order("name");

  return (
    <div className="p-4 space-y-4">
      <WelcomeHeading volunteer={volunteer} />

      <Tabs defaultValue="schools">
        <TabsList>
          <TabsTab value="schools">Schools</TabsTab>
          <TabsTab value="terms">Default school year</TabsTab>
        </TabsList>

        <TabsPanel value="schools" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Schools</h2>
            <Link href="/schools/new" className={buttonVariants()}>
              Add a school
            </Link>
          </div>
          <SchoolList schools={schools ?? []} />
          {selectedSchoolId && (
            <SchoolManagementTabs schoolId={selectedSchoolId} volunteerListError={volunteerListError} />
          )}
        </TabsPanel>

        <TabsPanel value="terms" className="space-y-6">
          <DefaultTerms />
          <BankHolidays />
        </TabsPanel>
      </Tabs>
    </div>
  );
}
