import type { createClient } from "@/lib/supabase/server";

// Shared by schoolWeekCalendar.tsx and termAgenda.tsx: a signed-in
// viewer's relationship to one school, independent of which dates are
// currently being displayed.
export async function getViewerSchoolContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  schoolId: number,
  volunteerId: string
): Promise<{ isSchoolMember: boolean; regularSlotIds: Set<number> }> {
  const { data: membership } = await supabase
    .from("volunteer_schools")
    .select("volunteer_id")
    .eq("volunteer_id", volunteerId)
    .eq("school_id", schoolId)
    .maybeSingle();
  const isSchoolMember = !!membership;

  // Slot templates the volunteer has 2+ confirmed signups on - "looks
  // like" an ongoing regular commitment, so the cancel dialog offers
  // "this and all future dates" as well as "just this date". There's no
  // stored marker for how a signup was created (see
  // schedule/actions.ts's claimSlot/cancelSignup), so this is inferred
  // rather than read directly. Deliberately not scoped to this school's
  // slots only - a slot_id already belongs to exactly one school via its
  // location, so no extra filtering is needed here.
  let regularSlotIds = new Set<number>();
  const { data: mySignups } = await supabase
    .from("signups")
    .select("slot_instance_id")
    .eq("volunteer_id", volunteerId)
    .eq("status", "confirmed");
  const myInstanceIds = (mySignups ?? []).map((s) => s.slot_instance_id);
  if (myInstanceIds.length > 0) {
    const { data: myInstances } = await supabase
      .from("slot_instances")
      .select("slot_id")
      .in("id", myInstanceIds);
    const counts = new Map<number, number>();
    for (const row of myInstances ?? []) {
      counts.set(row.slot_id, (counts.get(row.slot_id) ?? 0) + 1);
    }
    regularSlotIds = new Set([...counts].filter(([, count]) => count >= 2).map(([slotId]) => slotId));
  }

  return { isSchoolMember, regularSlotIds };
}
