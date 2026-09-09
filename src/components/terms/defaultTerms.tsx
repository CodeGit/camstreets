import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createDefaultYear, deleteDefaultTerm } from "./actions";
import TermDate from "./termDate";
import TermYearForm from "./termYearForm";

// Superuser-managed default term dates, used to pre-populate a school's
// own terms rather than an admin typing the same UK-wide dates in from
// scratch each time — see
// supabase/migrations/20260909102421_add_default_terms.sql. Not
// school-scoped: these are shared templates. No inset-days/bank-holidays
// collapsible here (that's TermDate's optional `offDays` prop, left
// unset) — inset days are school-specific and bank holidays get their own
// editor below.
export default async function DefaultTerms() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: volunteer } = user
    ? await supabase.from("volunteers").select("is_superuser").eq("id", user.id).maybeSingle()
    : { data: null };
  if (!volunteer?.is_superuser) {
    return null;
  }

  const { data: terms } = await supabase
    .from("default_terms")
    .select("*")
    .order("start_date");

  // Academic year is derived from each term's own start_date, not stored —
  // Autumn starts in the year the academic year is named after (2026/2027
  // starts with Autumn 2026), Spring/Summer start in the following
  // calendar year, so a start month before August means it belongs to the
  // academic year that began the previous autumn.
  const academicYearOf = (isoDate: string) => {
    const d = new Date(`${isoDate}T00:00:00Z`);
    const year = d.getUTCFullYear();
    return d.getUTCMonth() + 1 >= 8 ? year : year - 1;
  };

  const termsByYear = new Map<number, NonNullable<typeof terms>>();
  for (const term of terms ?? []) {
    const year = academicYearOf(term.start_date);
    termsByYear.set(year, [...(termsByYear.get(year) ?? []), term]);
  }
  const years = [...termsByYear.keys()].sort((a, b) => a - b);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">Default term dates</h2>
        <p className="text-sm text-muted-foreground">
          Shared start/end dates for the school year, used to pre-populate a
          school&apos;s own terms.
        </p>
        <a
          href="https://www.cambridgeshire.gov.uk/residents/children-and-families/schools-learning/school-term-dates-closures"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Cambridgeshire term dates
          <ExternalLink className="size-3.5" />
        </a>
      </div>

      {years.length === 0 && (
        <p className="text-muted-foreground">No default terms set yet.</p>
      )}

      {years.map((year) => (
        <TermDate
          key={year}
          year={year}
          terms={termsByYear.get(year)!.map((term) => ({
            ids: [term.id],
            name: term.name,
            start_date: term.start_date,
            half_term_start: term.half_term_start,
            half_term_end: term.half_term_end,
            end_date: term.end_date,
          }))}
          onDeleteTerm={deleteDefaultTerm}
        />
      ))}

      <TermYearForm action={createDefaultYear} />
    </div>
  );
}
