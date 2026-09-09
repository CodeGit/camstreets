"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createLocation(schoolId: number, formData: FormData) {
  const name = formData.get("name");
  const address = formData.get("address");

  if (typeof name !== "string" || !name) {
    return;
  }

  const supabase = await createClient();
  await supabase.from("locations").insert({
    school_id: schoolId,
    name,
    address: typeof address === "string" && address ? address : null,
  });

  revalidatePath("/dashboard");
}

// slots.location_id has no ON DELETE CASCADE, so deleting a location that
// still has slots would otherwise fail with a foreign-key violation —
// clean those up first rather than surface that as a confusing error.
export async function deleteLocation(locationId: number) {
  const supabase = await createClient();

  await supabase.from("slots").delete().eq("location_id", locationId);
  await supabase.from("locations").delete().eq("id", locationId);

  revalidatePath("/dashboard");
}

// Monday(1)..Friday(5) in the day_of_week convention (0=Sunday, matching
// JS Date#getDay()). School streets run on school days, and a slot's
// weekday-to-weekday times are almost always identical, so a "slot" here
// means one row per weekday rather than asking the admin to pick a single
// day — same idea as terms being stored as 2 half-term rows but shown as
// one 4-date term.
const WEEKDAYS = [1, 2, 3, 4, 5];

export async function createSlot(locationId: number, formData: FormData) {
  const label = formData.get("label");
  const startTime = formData.get("start_time");
  const endTime = formData.get("end_time");
  const capacity = formData.get("capacity");

  if (
    typeof label !== "string" || !label ||
    typeof startTime !== "string" || !startTime ||
    typeof endTime !== "string" || !endTime ||
    typeof capacity !== "string" || !capacity || Number(capacity) < 1
  ) {
    return;
  }

  const supabase = await createClient();
  await supabase.from("slots").insert(
    WEEKDAYS.map((dayOfWeek) => ({
      location_id: locationId,
      label,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      capacity: Number(capacity),
    }))
  );

  revalidatePath("/dashboard");
}

// Deletes every underlying weekday row for one displayed slot (see
// createSlot above — a displayed slot is always up to 5 rows, one per
// weekday).
export async function deleteSlot(slotIds: number[]) {
  const supabase = await createClient();

  await supabase.from("slots").delete().in("id", slotIds);

  revalidatePath("/dashboard");
}
