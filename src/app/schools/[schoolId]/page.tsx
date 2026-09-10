import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import SchoolWeekCalendar from "@/components/schedule/schoolWeekCalendar";

export default async function SchoolPage({
  params,
  searchParams,
}: {
  params: Promise<{ schoolId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { schoolId } = await params;
  const { date } = await searchParams;
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

  return (
    <div className="px-4 py-4 space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">{school.name}</h1>
      <SchoolWeekCalendar schoolId={schoolIdNum} schoolName={school.name} date={date} />
    </div>
  );
}
