import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/ui/tabs";
import VolunteerList from "./volunteerList";
import TermTimes from "./termTimes";
import LocationsAndSlots from "./locationsAndSlots";

// Shared by the admin and superuser dashboards — a superuser needs the same
// per-school controls (e.g. adding inset days on a less technical admin's
// behalf) an admin has, not a separate cut-down view. RLS already allows a
// superuser to write to any school's terms/off_days/locations, so this is
// just giving that permission a UI path.
export default function SchoolManagementTabs({
  schoolId,
  volunteerListError,
}: {
  schoolId: number;
  volunteerListError?: string;
}) {
  return (
    <Tabs defaultValue="volunteers">
      <TabsList>
        <TabsTab value="volunteers">Volunteers</TabsTab>
        <TabsTab value="term-times">Term times</TabsTab>
        <TabsTab value="locations">Locations</TabsTab>
      </TabsList>
      <TabsPanel value="volunteers">
        <VolunteerList schoolId={schoolId} error={volunteerListError} />
      </TabsPanel>
      <TabsPanel value="term-times">
        <TermTimes schoolId={schoolId} />
      </TabsPanel>
      <TabsPanel value="locations">
        <LocationsAndSlots schoolId={schoolId} />
      </TabsPanel>
    </Tabs>
  );
}
