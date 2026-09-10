"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select } from "@base-ui/react/select";

type School = { id: number; name: string };

// Compact inline selector for a dashboard's school-scoped tabs - unlike
// schoolSwitcher.tsx (navbar-wide, fetches its own school list client side,
// navigates to a school's public page), this takes the already
// server-fetched schools as a prop and navigates via a query param the
// dashboard reads. `paramName` lets two independent selectors coexist on the
// same page (e.g. the admin's own "Your schools" management pick and "My
// calendar"'s pick) - selecting one merges into the existing query string
// rather than replacing it, so it doesn't clobber the other's selection.
export default function SchoolSelector({
  schools,
  selectedSchoolId,
  paramName = "school",
}: {
  schools: School[];
  selectedSchoolId: number;
  paramName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const options = schools.map((school) => ({ label: school.name, value: school.id }));

  return (
    <Select.Root
      items={options}
      value={selectedSchoolId}
      onValueChange={(schoolId: number | null) => {
        if (schoolId === null) return;
        const params = new URLSearchParams(searchParams.toString());
        params.set(paramName, String(schoolId));
        router.push(`${pathname}?${params.toString()}`);
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
