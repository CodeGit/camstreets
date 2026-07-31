"use client";

import { useState, useEffect } from "react";
import { Select } from "@base-ui/react/select";
import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/client";

type Volunteer = Tables<"volunteers">;
type School = Tables<"schools">;

const ALL_SCHOOLS = { label: "All Schools", value: null };

async function fetchSchoolsFromSupabase(): Promise<School[]> {
  const supabase = createClient();
  const { data } = await supabase.from("schools").select("*").order("name");
  return data ?? [];
}

export default function SchoolSwitcher({
  volunteer,
  fetchSchoolsAction = fetchSchoolsFromSupabase,
  onSchoolSelectionAction
}: {
  volunteer: Volunteer | null;
  fetchSchoolsAction?: () => Promise<School[]>;
  onSchoolSelectionAction?: (schoolId: number | null) => void;
}) {
  const [schools, setSchools] = useState<School[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [defaultSchool, setDefaultSchool] = useState<number | null>(volunteer?.preferred_school_id ?? null);
  
  const handleOpenChange = async (open: boolean) => {
    if (!open || schools !== null || loading) return;

    setLoading(true);
    const data = await fetchSchoolsAction();
    setSchools(data);
    setLoading(false);
  };

  useEffect(() => {
    if (defaultSchool === null || schools !== null) return;
    handleOpenChange(true);
  }, [])

  const handleValueChange = (schoolId: number | null) => {
    setDefaultSchool(schoolId);
    onSchoolSelectionAction?.(schoolId);
  };

  const schoolSelectOptions:{label: string, value: number | null}[] = [ALL_SCHOOLS, ...(schools ?? []).map((school) => ({
    label: school.name,
    value: school.id,
  }))];

  const t = schoolSelectOptions.find((option) => option.value === defaultSchool) ?? null
  console.log(`Default school ID: ${defaultSchool}`);
  console.log(schoolSelectOptions);
  console.log(`Default school ID: ${t?.value}, label: ${t?.label}`);
  return (
    <Select.Root
      items={schoolSelectOptions}
      value={defaultSchool}
      onValueChange={handleValueChange}
      onOpenChange={handleOpenChange}
    >
      <Select.Trigger className="flex items-center gap-1 px-2.5 py-1 text-sm rounded-lg border border-border bg-background">
        <Select.Value placeholder="Select your school" />
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
