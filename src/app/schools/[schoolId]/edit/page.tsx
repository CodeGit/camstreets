import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SchoolForm from "@/components/schools/schoolForm";
import { updateSchool } from "./actions";

export default async function EditSchoolPage({
  params,
  searchParams,
}: {
  params: Promise<{ schoolId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { schoolId } = await params;
  const { error } = await searchParams;
  const schoolIdNum = parseInt(schoolId, 10);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: school } = await supabase
    .from("schools")
    .select("*")
    .eq("id", schoolIdNum)
    .maybeSingle();

  if (!school) {
    notFound();
  }

  const { data: volunteer } = await supabase
    .from("volunteers")
    .select("is_superuser")
    .eq("id", user.id)
    .maybeSingle();

  // Unlike creation (superuser-only), editing is also open to admins of
  // this specific school - matches the schools table's RLS update policy.
  const { data: adminOfSchool } = await supabase
    .from("school_admins")
    .select("school_id")
    .eq("school_id", schoolIdNum)
    .eq("volunteer_id", user.id)
    .maybeSingle();

  if (!volunteer?.is_superuser && !adminOfSchool) {
    redirect("/");
  }

  return (
    <SchoolForm
      action={updateSchool.bind(null, schoolIdNum)}
      title="Edit school"
      description={`Update details for ${school.name}.`}
      submitLabel="Save changes"
      error={error}
      defaultValues={{
        name: school.name,
        street: school.street ?? undefined,
        city: school.town ?? undefined,
      }}
    />
  );
}
