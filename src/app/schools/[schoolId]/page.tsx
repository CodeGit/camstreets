import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import DaySchedule, { type ScheduleInstance } from "@/components/schedule/day";

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function SchoolPage({
  params,
  searchParams,
}: {
  params: Promise<{ schoolId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { schoolId } = await params;
  const { date: dateParam } = await searchParams;
  const schoolIdNum = parseInt(schoolId, 10);
  const date = dateParam ?? toIsoDate(new Date());

  const supabase = await createClient();
  const { data: school } = await supabase
    .from("schools")
    .select("*")
    .eq("id", schoolIdNum)
    .maybeSingle();

  if (!school) {
    notFound();
  }

  const { data: term } = await supabase
    .from("terms")
    .select("id, name")
    .eq("school_id", schoolIdNum)
    .eq("status", "published")
    .lte("start_date", date)
    .gte("end_date", date)
    .maybeSingle();

  const { data: instances } = term
    ? await supabase
        .from("slot_instances")
        .select(
          `*,
          slot:slots ( *, location:locations ( * ) ),
          signups ( *, volunteer:volunteers ( * ) )`
        )
        .eq("term_id", term.id)
        .eq("date", date)
        .order("start_time")
        .returns<ScheduleInstance[]>()
    : { data: null };

  return (
    <div className="px-4 py-4 space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">{school.name}</h1>
      <DaySchedule date={date} hasPublishedTerm={!!term} instances={instances ?? []} />
    </div>
  );
}
