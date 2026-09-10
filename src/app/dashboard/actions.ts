"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { deleteUnclaimedInstances } from "@/lib/slotInstances";

// A school's admin count has to be read directly from school_admins, not
// inferred from who's visible in a volunteer_schools-based list - an admin
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

// Overwrites the volunteer's calendar feed token with a fresh one -
// whatever URL they'd previously subscribed a phone/Google/Outlook
// calendar with starts 404ing on its next refresh (see the feed route,
// src/app/calendar/[token]/feed.ics), so this is how "I think this
// leaked" or "I lost my phone" gets resolved. No expiry otherwise: the
// whole point of a subscribed feed is that it keeps syncing silently
// forever without the volunteer doing anything.
export async function regenerateCalendarFeedToken() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  // Also clears last_fetched_at - the rate limit lives on this same row
  // (see the feed route), and without this a freshly regenerated token
  // would inherit however recently the *old*, now-dead token happened to
  // be fetched, rate-limiting a brand new link before it's ever been used.
  await supabase
    .from("volunteer_calendar_feeds")
    .update({ token: crypto.randomUUID(), last_fetched_at: null })
    .eq("volunteer_id", user.id);

  revalidatePath("/dashboard");
}

// Also clears any admin rights the volunteer had for this specific school -
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
    // tab=schools: both admin@ and superuser@ dashboards now default to
    // "My calendar" - without this the error would land on a tab that
    // doesn't even render the Volunteers list it's about.
    redirect(`/dashboard?school=${schoolId}&tab=schools&error=last-admin`);
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
// start_date, end_date - see supabase/README.md), deliberately kept
// simple for the not-yet-built "publish a term" generation logic. Schools
// no longer create these manually - on_default_term_created (see
// 20260909123828_propagate_default_terms_to_schools.sql) populates them
// automatically from default_terms - but a school can still edit the
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
// TermDate's `ids` - a school's term is always a pair, unlike
// default_terms which is one row). A term's generated slot_instances don't
// cascade - see 20260909193738_generate_slot_instances.sql - so they're
// cleaned up first, same pattern as deleteSlot/deleteLocation in
// locationsActions.ts. Refused if any of them has a real signup.
export async function deleteSchoolTermPair(ids: number[]) {
  const supabase = await createClient();

  const { blocked } = await deleteUnclaimedInstances(supabase, "term_id", ids);
  if (blocked) {
    throw new Error(
      "Can't delete this term: a volunteer has signed up (even if since cancelled) for one of its slots."
    );
  }

  const { error } = await supabase.from("terms").delete().in("id", ids);
  if (error) {
    throw new Error(`Failed to delete this term: ${error.message}`);
  }

  revalidatePath("/dashboard");
}

// Reads however many inset_date_N/inset_label_N pairs are actually in the
// submission - InsetDaysForm starts with 5 rows but can add more, so this
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
      // tab=schools: both admin@ and superuser@ dashboards now default to
    // "My calendar" - without this the error would land on a tab that
    // doesn't even render the Volunteers list it's about.
    redirect(`/dashboard?school=${schoolId}&tab=schools&error=last-admin`);
    }

    await supabase
      .from("school_admins")
      .delete()
      .eq("school_id", schoolId)
      .eq("volunteer_id", volunteerId);
  }

  revalidatePath("/dashboard");
}

// Self-service admin grant for dev.camstreets.org's public demo only -
// lets an unknown visitor explore the admin side without anyone manually
// granting access. Two independent layers keep this from ever doing
// anything in production: the ALLOW_SELF_ELEVATE env var (set only in
// Vercel's Preview/dev scope, checked here - never inferred from
// VERCEL_ENV/domain, an authorization decision needs an explicit opt-in)
// and schools.is_demo (set only by scripts/seed-demo.mjs), so even a
// misconfigured env var couldn't grant anything real, since that set is
// always empty outside the demo. Uses the service-role client because a
// plain volunteer's own RLS-bound client can't insert into school_admins
// for a school they're not already an admin of - see
// 20260909092132_school_admins_manage_school_volunteers.sql.
export async function becomeDemoAdmin() {
  if (process.env.ALLOW_SELF_ELEVATE !== "true") {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const serviceClient = createServiceRoleClient();
  const { data: demoSchools } = await serviceClient.from("schools").select("id").eq("is_demo", true);

  if (!demoSchools || demoSchools.length === 0) {
    return;
  }

  const school = demoSchools[Math.floor(Math.random() * demoSchools.length)];

  // Both rows, not just school_admins: AdminDashboard's own school list
  // inner-joins on volunteer_schools (src/components/dashboards/
  // adminDashboard.tsx), so a school_admins-only grant would flip
  // is_admin (via the existing sync_volunteer_is_admin() trigger) but
  // leave the new admin looking at an empty "Your schools" list.
  // ignoreDuplicates so a repeat click no-ops instead of erroring.
  await serviceClient
    .from("volunteer_schools")
    .upsert({ volunteer_id: user.id, school_id: school.id }, { onConflict: "volunteer_id,school_id", ignoreDuplicates: true });
  await serviceClient
    .from("school_admins")
    .upsert({ volunteer_id: user.id, school_id: school.id }, { onConflict: "school_id,volunteer_id", ignoreDuplicates: true });

  revalidatePath("/dashboard");
}
