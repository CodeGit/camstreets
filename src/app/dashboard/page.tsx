import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SuperuserDashboard from "@/components/dashboards/superuserDashboard";
import AdminDashboard from "@/components/dashboards/adminDashboard";
import VolunteerDashboard from "@/components/dashboards/volunteerDashboard";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ school?: string; error?: string }>;
}) {
  const { school, error } = await searchParams;
  const selectedSchoolId = school ? parseInt(school, 10) : undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: volunteer } = await supabase
    .from("volunteers")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (volunteer?.is_superuser) {
    return (
      <SuperuserDashboard
        volunteer={volunteer}
        selectedSchoolId={selectedSchoolId}
        volunteerListError={error}
      />
    );
  }
  if (volunteer?.is_admin) {
    return (
      <AdminDashboard
        volunteer={volunteer}
        selectedSchoolId={selectedSchoolId}
        volunteerListError={error}
      />
    );
  }
  return <VolunteerDashboard volunteer={volunteer} />;
}