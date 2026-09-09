import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import WelcomeHeading from "@/components/dashboards/welcomeHeading";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import SchoolSelector from "../schools/schoolSelector";
import SchoolManagementTabs from "../schools/schoolManagementTabs";

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

  // Default to the admin's first school when none is chosen via ?school=,
  // rather than showing an empty dashboard.
  const effectiveSchoolId = selectedSchoolId ?? schools?.[0]?.id;

  return (
    <div className="p-4 space-y-4">
      <WelcomeHeading volunteer={volunteer} />
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-medium">Your schools</h2>
        {schools && schools.length > 0 && effectiveSchoolId && (
          <>
            <SchoolSelector schools={schools} selectedSchoolId={effectiveSchoolId} />
            <Link
              href={`/schools/${effectiveSchoolId}/edit`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Edit
            </Link>
          </>
        )}
      </div>
      {effectiveSchoolId && (
        <SchoolManagementTabs schoolId={effectiveSchoolId} volunteerListError={volunteerListError} />
      )}
    </div>
  );
}
