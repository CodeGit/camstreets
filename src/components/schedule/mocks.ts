import type { Tables } from "@/lib/supabase/database.types";
import type { ScheduleInstance } from "./instanceCard";

type Volunteer = Tables<"volunteers">;

// Shared by day.stories.tsx and week.stories.tsx - a single source of truth
// for building fake ScheduleInstance data so both stay in sync as the real
// shape (slot_instances joined to slots/locations/signups/volunteers)
// evolves.
export function mockVolunteer(
  overrides: Partial<Volunteer> & Pick<Volunteer, "id" | "display_name">
): Volunteer {
  return {
    created_at: "",
    is_admin: false,
    is_superuser: false,
    preferred_school_id: null,
    ...overrides,
  };
}

export function mockLocation(id: number, name: string): Tables<"locations"> {
  return { id, name, address: null, active: true, created_at: "", school_id: 1 };
}

export function mockInstance(input: {
  id: number;
  locationId: number;
  locationName: string;
  label: string;
  date?: string;
  startTime: string;
  endTime: string;
  capacity?: number;
  volunteers?: Volunteer[];
}): ScheduleInstance {
  const capacity = input.capacity ?? 2;
  return {
    id: input.id,
    slot_id: input.id,
    term_id: 1,
    date: input.date ?? "2026-09-07",
    start_time: input.startTime,
    end_time: input.endTime,
    capacity,
    status: "open",
    created_at: "",
    slot: {
      id: input.id,
      location_id: input.locationId,
      day_of_week: 1,
      start_time: input.startTime,
      end_time: input.endTime,
      label: input.label,
      capacity,
      active: true,
      created_at: "",
      location: mockLocation(input.locationId, input.locationName),
    },
    signups: (input.volunteers ?? []).map((volunteer, i) => ({
      id: input.id * 10 + i,
      slot_instance_id: input.id,
      volunteer_id: volunteer.id,
      status: "confirmed",
      created_at: "",
      volunteer,
    })),
  };
}

export const vera = mockVolunteer({ id: "00000000-0000-0000-0000-000000000001", display_name: "Vera" });
export const alex = mockVolunteer({ id: "00000000-0000-0000-0000-000000000002", display_name: "Alex" });
