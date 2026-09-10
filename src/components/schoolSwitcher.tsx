"use client";

import { useState, useEffect } from "react";
import { Select } from "@base-ui/react/select";
import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/client";

type Volunteer = Tables<"volunteers">;
type School = Tables<"schools">;

const NO_SCHOOL_SELECTED = { label: "Select a school from the list...", value: null };

type FetchSchoolsActionType = (volunteerId: string | null) => Promise<School[]>;

export const fetchAllSchoolsFromSupabase: FetchSchoolsActionType = async (volunteerId) => {
  const supabase = createClient();
  const { data } = await supabase.from("schools").select("*").order("name");
  return data ?? [];
};

export const fetchAdminSchoolsFromSupabase: FetchSchoolsActionType = async (volunteerId) => {
  if (!volunteerId) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from("schools")
    .select("*, school_admins!inner(*)")
    .eq("school_admins.volunteer_id", volunteerId)
    .order("name");
  return data ?? [];
}

export const fetchVolunteerSchoolsFromSupabase: FetchSchoolsActionType = async (volunteerId) => {
  if (!volunteerId) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from("schools")
    .select("*, volunteer_schools!inner(*)")
    .eq("volunteer_schools.volunteer_id", volunteerId)
    .order("name");
  return data ?? [];
}

export default function SchoolSwitcher({
  volunteer,
  fetchSchoolsAction = fetchAllSchoolsFromSupabase,
  onSchoolSelectionAction,
  showAllSchoolsOption = true,
}: {
  volunteer: Volunteer | null;
  fetchSchoolsAction?: FetchSchoolsActionType;
  onSchoolSelectionAction?: (schoolId: number | null) => void;
  showAllSchoolsOption?: boolean;
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

  // fetch schools when the component mounts if the schools are not already loaded and the default school is not set or if the "All Schools" option is not shown.
  useEffect(() => {
    if (schools !== null) return;
    if (defaultSchool !== null || !showAllSchoolsOption) {
      handleOpenChange(true);
    }
  }, [])

  // this is required when filtering schools for admins/volunteer dashboards.
  useEffect(() => {
    if (!schools || schools.length === 0) return;
    const preferredId = volunteer?.preferred_school_id ?? null;
    const preferredIdIsInList = preferredId !== null && schools.some((s) => s.id === preferredId);
    if (preferredIdIsInList) {
      setDefaultSchool(preferredId);
    } else if (!showAllSchoolsOption) {
      setDefaultSchool(schools[0].id);
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
  const schoolSelectOptions:{label: string, value: number | null}[] = showAllSchoolsOption ? [NO_SCHOOL_SELECTED, ...schoolOptions] : schoolOptions;
  
  return (
    <Select.Root
      items={schoolSelectOptions}
      value={defaultSchool}
      onValueChange={handleValueChange}
      onOpenChange={handleOpenChange}
    >
      <Select.Trigger className="flex max-w-[55vw] items-center gap-1 overflow-hidden px-2.5 py-1 text-sm rounded-lg border border-border bg-background sm:max-w-64">
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
