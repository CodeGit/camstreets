"use client";

import { useState, useEffect } from "react";
import { Select } from "@base-ui/react/select";
import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/client";

// Just `id` and `preferred_school_id` - not the full volunteers row.
type Volunteer = Pick<Tables<"volunteers">, "id" | "preferred_school_id">;
type School = Tables<"schools">;

const NO_SCHOOL_SELECTED = { label: "Select a school from the list...", value: null };

type FetchSchoolsActionType = (volunteerId: string | null) => Promise<School[]>;

export const fetchAllSchoolsFromSupabase: FetchSchoolsActionType = async (volunteerId) => {
  const supabase = createClient();
  const { data } = await supabase.from("schools").select("*").order("name");
  return data ?? [];
};

// The navbar's "View timetable" picker - unlike DashboardSchoolSelector
// (dashboard-scoped, takes an already server-fetched list, updates a query
// param without leaving the page), this lives in the navbar so it has no
// page-provided list to work from: it fetches its own schools client-side,
// lazily on first open, and navigates to a different route entirely
// (a school's public page, or "/" for "All schools").
export default function NavbarSchoolSwitcher({
  volunteer,
  fetchSchoolsAction = fetchAllSchoolsFromSupabase,
  onSchoolSelectionAction,
}: {
  volunteer: Volunteer | null;
  fetchSchoolsAction?: FetchSchoolsActionType;
  onSchoolSelectionAction?: (schoolId: number | null) => void;
}) {
  const [schools, setSchools] = useState<School[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [defaultSchool, setDefaultSchool] = useState<number | null>(volunteer?.preferred_school_id ?? null);
  
  const handleOpenChange = async (open: boolean) => {
    if (!open || schools !== null || loading) return;

    setLoading(true);
    const data = await fetchSchoolsAction(volunteer?.id ?? null);
    setSchools(data);
    setLoading(false);
  };

  // Fetch schools when the component mounts if a default school is already
  // selected (the picker needs the full list to show it as selected, even
  // before the user opens the dropdown themselves).
  useEffect(() => {
    if (schools !== null) return;
    if (defaultSchool !== null) {
      handleOpenChange(true);
    }
  }, [])

  // Keeps the selection in sync if the volunteer's preferred school changes
  // (e.g. after they update it elsewhere and this component re-renders).
  useEffect(() => {
    if (!schools || schools.length === 0) return;
    const preferredId = volunteer?.preferred_school_id ?? null;
    const preferredIdIsInList = preferredId !== null && schools.some((s) => s.id === preferredId);
    if (preferredIdIsInList) {
      setDefaultSchool(preferredId);
    }
  }, [schools]);

  const handleValueChange = (schoolId: number | null) => {
    setDefaultSchool(schoolId);
    onSchoolSelectionAction?.(schoolId);
  };

  const schoolOptions = (schools ?? []).map((school) => ({
    label: school.name,
    value: school.id,
  }));
  const schoolSelectOptions: { label: string; value: number | null }[] = [NO_SCHOOL_SELECTED, ...schoolOptions];

  return (
    <Select.Root
      items={schoolSelectOptions}
      value={defaultSchool}
      onValueChange={handleValueChange}
      onOpenChange={handleOpenChange}
    >
      <Select.Trigger className="flex max-w-[80vw] items-center gap-1 overflow-hidden px-2.5 py-1 text-sm rounded-lg border border-border bg-background sm:max-w-96">
        <Select.Value placeholder="Select your school" className="min-w-0 truncate" />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner className="z-50" sideOffset={4}>
          <Select.Popup className="rounded-lg border border-border bg-popover text-popover-foreground shadow-md py-1 min-w-[var(--anchor-width)]">
            <Select.List>
              {loading && (
                <div className="px-2.5 py-1 text-sm text-muted-foreground">
                  Loading…
                </div>
              )}
              {schoolSelectOptions.map((item) => (
                <Select.Item
                  key={item.value ?? "all-schools"}
                  value={item.value}
                  className="px-2.5 py-1 text-sm outline-none cursor-default data-[highlighted]:bg-muted data-[highlighted]:text-foreground"
                >
                  <Select.ItemText>{item.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
