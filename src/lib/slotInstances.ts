import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// Deletes generated slot_instances (see
// 20260909193738_generate_slot_instances.sql) matching a slot or term, but
// refuses if any of them has ever had a signup on it - even a cancelled
// one. Signups are never hard-deleted (there's no RLS delete policy for
// them at all: cancelling one is always an explicit status update, see
// "volunteers can cancel their own signups" / "school admins can cancel
// signups for their slots" in 20260707162819_enable_rls.sql), and the FK
// from signups to slot_instances doesn't care about status either - a
// cancelled signup is still real history a volunteer once committed to,
// and its row still blocks deleting the instance it references. The
// caller should throw when `blocked` comes back true, before deleting the
// parent row (slot/location/term) and hitting that foreign-key error
// directly instead.
export async function deleteUnclaimedInstances(
  supabase: SupabaseClient,
  column: "slot_id" | "term_id",
  ids: number[]
): Promise<{ blocked: boolean }> {
  if (ids.length === 0) return { blocked: false };

  const { data: instances, error: selectError } = await supabase
    .from("slot_instances")
    .select("id, signups(id)")
    .in(column, ids);
  if (selectError) {
    throw new Error(`Failed to look up slot instances: ${selectError.message}`);
  }

  const hasAnySignup = (instances ?? []).some((instance) => instance.signups.length > 0);
  if (hasAnySignup) {
    return { blocked: true };
  }

  const instanceIds = (instances ?? []).map((instance) => instance.id);
  if (instanceIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("slot_instances")
      .delete()
      .in("id", instanceIds);
    if (deleteError) {
      throw new Error(`Failed to delete slot instances: ${deleteError.message}`);
    }
  }
  return { blocked: false };
}
