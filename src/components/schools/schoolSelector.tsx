"use client";

import { useRouter } from "next/navigation";
import { Select } from "@base-ui/react/select";

type School = { id: number; name: string };

// Compact inline selector for the admin dashboard's "Your schools" header —
// unlike schoolSwitcher.tsx (navbar-wide, fetches its own school list client
// side, navigates to a school's public page), this takes the already
// server-fetched schools as a prop and navigates via the ?school= query
// param the dashboard reads. Reuses the same base-ui Select primitive/styling
// as schoolSwitcher.tsx for visual consistency without duplicating the fetch.
export default function SchoolSelector({
  schools,
  selectedSchoolId,
}: {
  schools: School[];
  selectedSchoolId: number;
}) {
  const router = useRouter();

  const options = schools.map((school) => ({ label: school.name, value: school.id }));

  return (
    <Select.Root
      items={options}
      value={selectedSchoolId}
      onValueChange={(schoolId: number | null) => {
        if (schoolId !== null) router.push(`/dashboard?school=${schoolId}`);
      }}
    >
      <Select.Trigger className="flex items-center gap-1 px-2.5 py-1 text-sm rounded-lg border border-border bg-background">
        <Select.Value placeholder="Select a school" />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner className="z-50" sideOffset={4}>
          <Select.Popup className="rounded-lg border border-border bg-popover text-popover-foreground shadow-md py-1 min-w-[var(--anchor-width)]">
            <Select.List>
              {options.map((item) => (
                <Select.Item
                  key={item.value}
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
