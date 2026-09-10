import { createClient } from "@/lib/supabase/server";
import { TabsList, TabsTab } from "@/components/ui/tabs";
import SchoolSelector from "@/components/schools/schoolSelector";
import SchoolDayCalendar from "@/components/schedule/schoolDayCalendar";
import SchoolWeekCalendar from "@/components/schedule/schoolWeekCalendar";
import SchoolMonthCalendar from "@/components/schedule/schoolMonthCalendar";
import SchoolTermCalendar from "@/components/schedule/schoolTermCalendar";
import UrlTabs from "./urlTabs";
import CalendarFeedLink from "./calendarFeedLink";

const VIEWS = ["day", "week", "month", "term"] as const;
type View = (typeof VIEWS)[number];

// Shared "My calendar" content: a school selector scoped to the schools
// this volunteer has signed up at (volunteer_schools), auto-selecting the
// first one, plus a day/week/month/term switcher over that school's
// slots. Month is the default - a compact swatch grid (schoolMonthCalendar)
// that's the real point of this view: "what am I committed to, and where
// else could I help", at a glance, term-scale - distinct from the public
// school page's single-week coverage grid, which this used to just
// duplicate with extra school-scoping before this redesign. Used as-is
// for the plain volunteer dashboard (no tabs) and embedded as a tab on
// the admin/superuser dashboards, which is why the school-selector's
// query param name is parameterized - those dashboards already use
// `?school=` for their own "Your schools" management selector and `?tab=`
// for which tab is active, both of which "My calendar"'s own navigation
// must preserve rather than clobber. The view switcher's own `?view=`
// param needs no such parameterizing, since nothing else on either
// dashboard uses that name.
export default async function MyCalendar({
  volunteerId,
  selectedSchoolId,
  date,
  view,
  paramName = "school",
  tabParam,
}: {
  volunteerId: string;
  selectedSchoolId?: number;
  date?: string;
  view?: string;
  paramName?: string;
  tabParam?: string;
}) {
  const supabase = await createClient();
  const { data: schools } = await supabase
    .from("schools")
    .select("*, volunteer_schools!inner(*)")
    .eq("volunteer_schools.volunteer_id", volunteerId)
    .order("name");

  const effectiveSchoolId = selectedSchoolId ?? schools?.[0]?.id;
  const effectiveSchool = schools?.find((s) => s.id === effectiveSchoolId);

  if (!schools || schools.length === 0 || !effectiveSchoolId || !effectiveSchool) {
    return (
      <p className="text-muted-foreground">
        You haven&apos;t signed up to volunteer at any schools yet.
      </p>
    );
  }

  const effectiveView: View = VIEWS.includes(view as View) ? (view as View) : "month";

  const extraParams: Record<string, string> = { [paramName]: String(effectiveSchoolId), view: effectiveView };
  if (tabParam) extraParams.tab = tabParam;

  const calendarProps = {
    schoolId: effectiveSchoolId,
    schoolName: effectiveSchool.name,
    date,
    extraParams,
  };

  return (
    <div className="space-y-4">
      <CalendarFeedLink />
      <div className="flex flex-wrap items-center gap-3">
        {schools.length > 1 && (
          <SchoolSelector schools={schools} selectedSchoolId={effectiveSchoolId} paramName={paramName} />
        )}
        <UrlTabs activeTab={effectiveView} paramName="view">
          <TabsList>
            <TabsTab value="day">Day</TabsTab>
            <TabsTab value="week">Week</TabsTab>
            <TabsTab value="month">Month</TabsTab>
            <TabsTab value="term">Term</TabsTab>
          </TabsList>
        </UrlTabs>
      </div>

      {effectiveView === "day" && <SchoolDayCalendar {...calendarProps} />}
      {effectiveView === "week" && <SchoolWeekCalendar {...calendarProps} />}
      {effectiveView === "month" && <SchoolMonthCalendar {...calendarProps} />}
      {effectiveView === "term" && <SchoolTermCalendar {...calendarProps} />}
    </div>
  );
}
