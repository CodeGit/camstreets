import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function SchoolPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = await params;
  const schoolIdNum = parseInt(schoolId, 10);
  const supabase = await createClient();
  const { data: school } = await supabase
    .from("schools")
    .select("*")
    .eq("id", schoolIdNum)
    .maybeSingle();

  if (!school) {
    notFound();
  }

return <h1 className="text-2xl font-semibold text-foreground">{school.name}</h1>}