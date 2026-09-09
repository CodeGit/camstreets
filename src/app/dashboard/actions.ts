"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// A school's admin count has to be read directly from school_admins, not
// inferred from who's visible in a volunteer_schools-based list — an admin
// isn't necessarily also a "volunteer" of their own school (e.g. seeded
// admin@example.com is admin of Newnham Croft Primary but was never added
// to volunteer_schools there), so counting rendered list rows would
// undercount and let the real last admin slip through.
async function isLastAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  schoolId: number
) {
  const { count } = await supabase
    .from("school_admins")
    .select("*", { count: "exact", head: true })
    .eq("school_id", schoolId);
  return (count ?? 0) <= 1;
}

export async function updateDisplayName(formData: FormData) {
  const displayName = formData.get("displayName");

  if (typeof displayName !== "string" || !displayName.trim()) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await supabase
    .from("volunteers")
    .update({ display_name: displayName.trim() })
    .eq("id", user.id);

  revalidatePath("/dashboard");
}

// Also clears any admin rights the volunteer had for this specific school —
// volunteer_schools and school_admins aren't linked by a foreign key, so
// without this a removed volunteer could be left as a "phantom" admin of a
// school they're no longer part of.
export async function removeVolunteerFromSchool(schoolId: number, volunteerId: string) {
  const supabase = await createClient();

  const { data: adminRow } = await supabase
    .from("school_admins")
    .select("volunteer_id")
    .eq("school_id", schoolId)
    .eq("volunteer_id", volunteerId)
    .maybeSingle();

  if (adminRow && (await isLastAdmin(supabase, schoolId))) {
    redirect(`/dashboard?school=${schoolId}&error=last-admin`);
  }

  await supabase
    .from("school_admins")
    .delete()
    .eq("school_id", schoolId)
    .eq("volunteer_id", volunteerId);

  await supabase
    .from("volunteer_schools")
    .delete()
    .eq("school_id", schoolId)
    .eq("volunteer_id", volunteerId);

  revalidatePath("/dashboard");
}

// terms is still stored as two half-term rows per season (school_id, name,
// start_date, end_date — see supabase/README.md), deliberately kept
// simple for the not-yet-built "publish a term" generation logic. Schools
// no longer create these manually — on_default_term_created (see
// 20260909123828_propagate_default_terms_to_schools.sql) populates them
// automatically from default_terms — but a school can still edit the
// resulting dates on both halves at once if it needs to diverge.
export async function updateSchoolTermPair(ids: number[], formData: FormData) {
  const [firstId, secondId] = ids;
  const startDate = formData.get("start_date");
  const halfTermStart = formData.get("half_term_start");
  const halfTermEnd = formData.get("half_term_end");
  const endDate = formData.get("end_date");

  if (
    !firstId || !secondId ||
    typeof startDate !== "string" || !startDate ||
    typeof halfTermStart !== "string" || !halfTermStart ||
    typeof halfTermEnd !== "string" || !halfTermEnd ||
    typeof endDate !== "string" || !endDate
  ) {
    return;
  }

  const supabase = await createClient();
  await supabase.from("terms").update({ start_date: startDate, end_date: halfTermStart }).eq("id", firstId);
  await supabase.from("terms").update({ start_date: halfTermEnd, end_date: endDate }).eq("id", secondId);

  revalidatePath("/dashboard");
}

// Deletes both underlying half-term rows for one displayed term (see
// TermDate's `ids` — a school's term is always a pair, unlike
// default_terms which is one row).
export async function deleteSchoolTermPair(ids: number[]) {
  const supabase = await createClient();

  await supabase.from("terms").delete().in("id", ids);

  revalidatePath("/dashboard");
}

// Reads however many inset_date_N/inset_label_N pairs are actually in the
// submission — InsetDaysForm starts with 5 rows but can add more, so this
// can't assume a fixed count. Blank rows (no date entered) are skipped.
export async function addInsetDays(schoolId: number, formData: FormData) {
  const supabase = await createClient();

  const rowNumbers = [...formData.keys()]
    .map((key) => key.match(/^inset_date_(\d+)$/)?.[1])
    .filter((n): n is string => n !== undefined);

  const rows: { type: "inset_day"; school_id: number; date: string; label: string | null }[] = [];
  for (const n of rowNumbers) {
    const date = formData.get(`inset_date_${n}`);
    const label = formData.get(`inset_label_${n}`);
    if (typeof date === "string" && date) {
      rows.push({
        type: "inset_day",
        school_id: schoolId,
        date,
        label: typeof label === "string" && label ? label : null,
      });
    }
  }

  if (rows.length > 0) {
    await supabase.from("off_days").insert(rows);
  }

  revalidatePath("/dashboard");
}

export async function setSchoolAdmin(schoolId: number, volunteerId: string, isAdmin: boolean) {
  const supabase = await createClient();

  if (isAdmin) {
    await supabase
      .from("school_admins")
      .insert({ school_id: schoolId, volunteer_id: volunteerId });
  } else {
    if (await isLastAdmin(supabase, schoolId)) {
      redirect(`/dashboard?school=${schoolId}&error=last-admin`);
    }

    await supabase
      .from("school_admins")
      .delete()
      .eq("school_id", schoolId)
      .eq("volunteer_id", volunteerId);
  }

  revalidatePath("/dashboard");
}
