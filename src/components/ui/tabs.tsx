"use client";

// Thin styled wrapper around @base-ui/react/tabs. Kept as a client
// component (tab switching is interactive), but its panel contents can
// still be async Server Components passed in as children — Next.js
// renders those server-side once and hands the result down as children,
// same as any other server-in-client composition.
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cn } from "@/lib/utils";

function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("space-y-4", className)} {...props} />;
}

function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "relative flex gap-1 border-b border-border",
        className
      )}
      {...props}
    />
  );
}

function TabsTab({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-tab"
      className={cn(
        "-mb-px border-b-2 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground data-[selected]:border-primary data-[selected]:text-foreground",
        className
      )}
      {...props}
    />
  );
}

function TabsPanel({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-panel"
      className={cn("outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTab, TabsPanel };
