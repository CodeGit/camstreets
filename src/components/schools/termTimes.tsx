import { createClient } from "@/lib/supabase/server";
import TermDate, { type OffDayEntry, type TermDateEntry } from "@/components/terms/termDate";
import InsetDaysForm from "./insetDaysForm";
import { updateSchoolTermPair, deleteSchoolTermPair, addInsetDays } from "@/app/dashboard/actions";
import { pairHalfTerms, academicYearOf } from "@/lib/terms";

function groupByYear<T extends { start_date: string } | { date: string }>(
  rows: T[]
): Map<number, T[]> {
  const byYear = new Map<number, T[]>();
  for (const row of rows) {
    const dateStr = "start_date" in row ? row.start_date : row.date;
    const year = academicYearOf(dateStr);
    byYear.set(year, [...(byYear.get(year) ?? []), row]);
  }
  return byYear;
}

// A bank holiday during what's already a school holiday period isn't
// useful to flag - only show one if it falls on an actual teaching day
// (inside some term's start..half-term-start or half-term-end..end
// range). Inset days are unfiltered: the school chose those itself, on
// dates it presumably already knows are term time.
function isWithinTermTime(date: string, terms: TermDateEntry[]): boolean {
  return terms.some(
    (term) =>
      (date >= term.start_date && date < term.half_term_start) ||
      (date > term.half_term_end && date <= term.end_date)
  );
}

export default async function TermTimes({ schoolId }: { schoolId: number }) {
  const supabase = await createClient();

  const { data: rawTerms } = await supabase
    .from("terms")
    .select("*")
    .eq("school_id", schoolId)
    .order("start_date");

  const { data: offDayRows } = await supabase
    .from("off_days")
    .select("*")
    .in("type", ["inset_day", "bank_holiday"])
    .or(`school_id.eq.${schoolId},school_id.is.null`)
    .order("date");

  const terms = pairHalfTerms(rawTerms ?? []);
  const termsByYear = groupByYear(terms);
  const allOffDays: OffDayEntry[] = (offDayRows ?? []).map((d) => ({
    id: d.id,
    type: d.type as "bank_holiday" | "inset_day",
    date: d.date,
    label: d.label,
  }));

  const years = [...new Set([...termsByYear.keys(), ...groupByYear(allOffDays).keys()])].sort(
    (a, b) => a - b
  );

  // Filter bank holidays to term time per year, using that year's own
  // terms - a holiday can only be "in term time" relative to the terms
  // that actually exist for its year.
  const offDaysByYear = new Map<number, OffDayEntry[]>();
  for (const year of years) {
    const yearTerms = termsByYear.get(year) ?? [];
    const yearOffDays = allOffDays.filter(
      (d) =>
        academicYearOf(d.date) === year &&
        (d.type === "inset_day" || isWithinTermTime(d.date, yearTerms))
    );
    offDaysByYear.set(year, yearOffDays);
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Terms</h3>
        <p className="text-sm text-muted-foreground">
          Populated automatically from the default term dates - adjust a
          term&apos;s dates below if this school needs to diverge.
        </p>

        {years.length === 0 && (
          <p className="text-muted-foreground">
            No terms yet - these appear once the superuser sets up default
            term dates for a year.
          </p>
        )}
      </div>

      {years.map((year) => (
        <TermDate
          key={year}
          year={year}
          terms={termsByYear.get(year) ?? []}
          offDays={offDaysByYear.get(year)}
          onDeleteTerm={deleteSchoolTermPair}
          onEditTerm={updateSchoolTermPair}
        >
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">
              Add inset days for {year}/{year + 1}
            </h4>
            <InsetDaysForm action={addInsetDays.bind(null, schoolId)} />
          </div>
        </TermDate>
      ))}
    </div>
  );
}
