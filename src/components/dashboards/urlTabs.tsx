"use client";

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
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
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <Tabs
        value={activeTab}
        onValueChange={(tab) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set(paramName, String(tab));
          // router.push here re-fetches the async Server Component
          // content a tab switch reveals (e.g. My Calendar's month/week/
          // day/term views) - wrapping it in a transition is what makes
          // isPending available at all, so a slow round trip (dev.
          // camstreets.org, say) shows a spinner rather than the tab
          // looking selected with nothing else happening for a moment.
          startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
          });
        }}
      >
        {children}
      </Tabs>
      {isPending && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-label="Loading" />}
    </div>
  );
}
