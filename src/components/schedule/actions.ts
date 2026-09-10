"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// A mutation can fail with an RLS "insufficient privilege" error even after
// getUser() reported a signed-in user. Two different Postgres messages map
// to this SQLSTATE (42501): "permission denied for table X" (role has no
// grant at all - e.g. anon) vs "new row violates row-level security policy"
// (role is authenticated, but auth.uid() didn't match the row being
// written). The second one is the more surprising case - it means the
// request WAS authenticated, just seemingly as the wrong identity, which
// doesn't fit a simple "token already expired" story. Logged in full
// (code/details/hint/the user id we attempted) rather than swallowed, so a
// recurrence is diagnosable instead of guessed at again.
function isAuthError(error: { code?: string; message: string }) {
  return error.code === "42501" || error.message.includes("row-level security");
}

function logAuthError(action: string, userId: string, error: { code?: string; message: string; details?: string | null; hint?: string | null }) {
  // Next's dev-log capture only reliably keeps a single string argument to
  // console.error - an object second argument was silently coming through
  // as "{}" - so build the whole thing into one string ourselves.
  console.error(
    `[${action}] signups mutation hit an auth/RLS error: ` +
      JSON.stringify({
        attemptedVolunteerId: userId,
        code: error.code ?? null,
        message: error.message,
        details: error.details ?? null,
        hint: error.hint ?? null,
      })
  );
}

// upsert (not insert) because a volunteer who previously cancelled already
// has a row for (slot_instance_id, volunteer_id) - the unique constraint on
// that pair means a plain insert would fail; this just flips it back to
// confirmed instead. `commitment_type` ("one_off" | "regular") comes from
// the sign-up dialog's radio choice - see TODO.md §5: "Regular" needs no
// new schema, it's just one ordinary signups row per matching slot_instance
// for the rest of the term, same shape as a one-off signup.
export async function claimSlot(slotInstanceId: number, schoolId: number, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Signing up for a slot also joins the volunteer to that slot's school -
  // "volunteers can sign themselves up" on public.signups (see
  // 20260801122733_add_volunteer_schools.sql) requires a matching
  // volunteer_schools row, added there specifically to stop a volunteer
  // accidentally signing up at the wrong school. ignoreDuplicates (ON
  // CONFLICT DO NOTHING) rather than a plain upsert (DO UPDATE): there's no
  // column here worth updating on a re-join, and that migration only
  // granted authenticated INSERT/SELECT/DELETE on this table - no UPDATE -
  // so a DO UPDATE upsert gets rejected outright (Postgres checks
  // privileges for the whole ON CONFLICT clause up front, even for a row
  // that would only ever take the INSERT path).
  const { error: joinError } = await supabase
    .from("volunteer_schools")
    .upsert(
      { volunteer_id: user.id, school_id: schoolId },
      { onConflict: "volunteer_id,school_id", ignoreDuplicates: true }
    );
  if (joinError) {
    throw new Error(`Failed to join this school: ${joinError.message}`);
  }

  const commitmentType = formData.get("commitment_type");

  if (commitmentType === "regular") {
    const { data: instance, error: instanceError } = await supabase
      .from("slot_instances")
      .select("slot_id, date")
      .eq("id", slotInstanceId)
      .single();
    if (instanceError) {
      throw new Error(`Failed to look up this slot: ${instanceError.message}`);
    }

    // Every remaining occurrence of the same slot template - not scoped to
    // the current term, so this covers the rest of the academic year
    // (every term generated so far), and picks up any further terms
    // automatically as they're added later.
    const { data: matchingInstances, error: matchError } = await supabase
      .from("slot_instances")
      .select("id")
      .eq("slot_id", instance.slot_id)
      .gte("date", instance.date);
    if (matchError) {
      throw new Error(`Failed to find this slot's remaining dates: ${matchError.message}`);
    }

    const rows = (matchingInstances ?? []).map((match) => ({
      slot_instance_id: match.id,
      volunteer_id: user.id,
      status: "confirmed" as const,
    }));
    const { error } = await supabase
      .from("signups")
      .upsert(rows, { onConflict: "slot_instance_id,volunteer_id" });
    if (error) {
      if (isAuthError(error)) {
        logAuthError("claimSlot/regular", user.id, error);
        redirect("/login?error=session-expired");
      }
      throw new Error(`Failed to sign up: ${error.message}`);
    }
  } else {
    const { error } = await supabase
      .from("signups")
      .upsert(
        { slot_instance_id: slotInstanceId, volunteer_id: user.id, status: "confirmed" },
        { onConflict: "slot_instance_id,volunteer_id" }
      );
    if (error) {
      if (isAuthError(error)) {
        logAuthError("claimSlot/one_off", user.id, error);
        redirect("/login?error=session-expired");
      }
      throw new Error(`Failed to sign up: ${error.message}`);
    }
  }

  revalidatePath(`/schools/${schoolId}`);
}

// Cancelling is always a status update, never a delete - see
// deleteUnclaimedInstances (src/lib/slotInstances.ts) for why signups are
// never hard-deleted. Defaults to per-instance (the plain confirm-cancel
// dialog submits no `cancellation_type` at all), but when the card detects
// this signup is part of an ongoing regular commitment, the dialog offers
// "this and all future dates" too - same slot template, cancelling from
// this date onward, mirroring claimSlot's "regular" scope.
export async function cancelSignup(slotInstanceId: number, schoolId: number, formData?: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const cancellationType = formData?.get("cancellation_type");

  if (cancellationType === "regular") {
    const { data: instance, error: instanceError } = await supabase
      .from("slot_instances")
      .select("slot_id, date")
      .eq("id", slotInstanceId)
      .single();
    if (instanceError) {
      throw new Error(`Failed to look up this slot: ${instanceError.message}`);
    }

    const { data: matchingInstances, error: matchError } = await supabase
      .from("slot_instances")
      .select("id")
      .eq("slot_id", instance.slot_id)
      .gte("date", instance.date);
    if (matchError) {
      throw new Error(`Failed to find this slot's remaining dates: ${matchError.message}`);
    }

    const { error } = await supabase
      .from("signups")
      .update({ status: "cancelled" })
      .in(
        "slot_instance_id",
        (matchingInstances ?? []).map((match) => match.id)
      )
      .eq("volunteer_id", user.id);
    if (error) {
      if (isAuthError(error)) {
        logAuthError("cancelSignup/regular", user.id, error);
        redirect("/login?error=session-expired");
      }
      throw new Error(`Failed to cancel these signups: ${error.message}`);
    }
  } else {
    const { error } = await supabase
      .from("signups")
      .update({ status: "cancelled" })
      .eq("slot_instance_id", slotInstanceId)
      .eq("volunteer_id", user.id);
    if (error) {
      if (isAuthError(error)) {
        logAuthError("cancelSignup", user.id, error);
        redirect("/login?error=session-expired");
      }
      throw new Error(`Failed to cancel this signup: ${error.message}`);
    }
  }

  revalidatePath(`/schools/${schoolId}`);
}
