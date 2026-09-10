import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import WelcomeHeading from "@/components/dashboards/welcomeHeading";
import { buttonVariants } from "@/components/ui/button";
import { TabsList, TabsTab, TabsPanel } from "@/components/ui/tabs";
import Link from "next/link";
import SchoolSelector from "../schools/schoolSelector";
import SchoolManagementTabs from "../schools/schoolManagementTabs";
import UrlTabs from "./urlTabs";
import MyCalendar from "./myCalendar";
import BecomeAdminButton from "./becomeAdminButton";

type Volunteer = Tables<"volunteers">;

export default async function AdminDashboard({
  volunteer,
  selectedSchoolId,
  volunteerListError,
  activeTab,
  myCalendarSchoolId,
  date,
  view,
}: {
  volunteer: Volunteer;
  selectedSchoolId?: number;
  volunteerListError?: string;
  activeTab?: string;
  myCalendarSchoolId?: number;
  date?: string;
  view?: string;
}) {
  const supabase = await createClient();

  // "Your schools" now covers every school this admin has volunteered at
  // (volunteer_schools), not just the ones they administer - school_admins
  // is checked separately below purely to decide whether the "Edit" link
  // and management tabs are shown for the currently selected one.
  const { data: schools } = await supabase
    .from("schools")
    .select("*, volunteer_schools!inner(*)")
    .eq("volunteer_schools.volunteer_id", volunteer.id)
    .order("name");

  const { data: adminRows } = await supabase
    .from("school_admins")
    .select("school_id")
    .eq("volunteer_id", volunteer.id);
  const adminSchoolIds = new Set((adminRows ?? []).map((row) => row.school_id));

  // Default to the admin's first school when none is chosen via ?school=,
  // rather than showing an empty dashboard.
  const effectiveSchoolId = selectedSchoolId ?? schools?.[0]?.id;
  const isEffectiveSchoolAdmin = effectiveSchoolId ? adminSchoolIds.has(effectiveSchoolId) : false;

  // Mark admin-eligible schools with an asterisk in the selector itself,
  // since a volunteer can belong to several schools but only administer
  // some of them.
  const selectorSchools = (schools ?? []).map((school) => ({
    id: school.id,
    name: adminSchoolIds.has(school.id) ? `${school.name} *` : school.name,
  }));

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <WelcomeHeading volunteer={volunteer} />
        <BecomeAdminButton />
      </div>

      <UrlTabs activeTab={activeTab ?? "calendar"}>
        <TabsList>
          <TabsTab value="calendar">My calendar</TabsTab>
          <TabsTab value="schools">Administer schools</TabsTab>
        </TabsList>

        <TabsPanel value="schools" className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-medium">Administer</h2>
            {schools && schools.length > 0 && effectiveSchoolId && (
              <>
                <SchoolSelector schools={selectorSchools} selectedSchoolId={effectiveSchoolId} />
                {isEffectiveSchoolAdmin && (
                  <Link
                    href={`/schools/${effectiveSchoolId}/edit`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Edit
                  </Link>
                )}
              </>
            )}
          </div>
          {adminSchoolIds.size > 0 && (
            <p className="text-xs text-muted-foreground">* You administer this school</p>
          )}
          {effectiveSchoolId && isEffectiveSchoolAdmin && (
            <SchoolManagementTabs schoolId={effectiveSchoolId} volunteerListError={volunteerListError} />
          )}
          {effectiveSchoolId && !isEffectiveSchoolAdmin && (
            <p className="text-muted-foreground">You&apos;re not an admin for this school.</p>
          )}
        </TabsPanel>

        <TabsPanel value="calendar">
          <MyCalendar
            volunteerId={volunteer.id}
            selectedSchoolId={myCalendarSchoolId}
            date={date}
            view={view}
            paramName="myCalendarSchool"
            tabParam="calendar"
          />
        </TabsPanel>
      </UrlTabs>
    </div>
  );
}
