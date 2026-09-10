"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Tabs } from "@/components/ui/tabs";

// Tabs, but with the active tab kept in a query param rather than
// component-local state. Plain uncontrolled Tabs (ui/tabs.tsx) resets to
// its defaultValue on every navigation - and a week/day/month link
// changing the `date` query param, or a term link changing it too, is a
// full navigation, which would otherwise silently kick the viewer back to
// whichever tab is first. Reused for both the admin/superuser dashboard's
// own outer tabs (paramName "tab") and "My calendar"'s day/week/month/
// term switcher (paramName "view") - same underlying behaviour, just a
// different param so the two can coexist on one page without clobbering
// each other.
export default function UrlTabs({
  activeTab,
  paramName = "tab",
  children,
}: {
  activeTab: string;
  paramName?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <Tabs
      value={activeTab}
      onValueChange={(tab) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set(paramName, String(tab));
        router.push(`${pathname}?${params.toString()}`);
      }}
    >
      {children}
    </Tabs>
  );
}
