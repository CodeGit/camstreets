import type { TermDateEntry } from "@/components/terms/termDate";

// terms is stored as two half-term rows per season, named "<Season> 1
// <year>" / "<Season> 2 <year>" - auto-populated from default_terms by
// on_default_term_created, and paired back up here into the 4-date shape
// TermDate expects, without changing the underlying table (see the
// comment on updateSchoolTermPair in dashboard/actions.ts). Rows that
// don't have both halves are skipped rather than shown with missing data.
// Shared by termTimes.tsx (the editable list) and termAgenda.tsx ("My
// calendar"'s whole-term view), which both need the same season grouping.
export function pairHalfTerms(
  terms: { id: number; name: string; start_date: string; end_date: string }[]
): TermDateEntry[] {
  const halves = new Map<string, { 1?: (typeof terms)[number]; 2?: (typeof terms)[number] }>();
  for (const term of terms) {
    const match = term.name.match(/^(Autumn|Spring|Summer) (1|2) (\d+)$/);
    if (!match) continue;
    const [, season, half, year] = match;
    const key = `${season} ${year}`;
    const entry = halves.get(key) ?? {};
    entry[half === "1" ? 1 : 2] = term;
    halves.set(key, entry);
  }

  const result: TermDateEntry[] = [];
  for (const [name, { 1: first, 2: second }] of halves) {
    if (!first || !second) continue;
    result.push({
      ids: [first.id, second.id],
      name,
      start_date: first.start_date,
      half_term_start: first.end_date,
      half_term_end: second.start_date,
      end_date: second.end_date,
    });
  }
  return result.sort((a, b) => a.start_date.localeCompare(b.start_date));
}

// Same August-cutoff rule used throughout (defaultTerms.tsx): a date from
// August onward belongs to the academic year starting that calendar year.
export function academicYearOf(isoDate: string) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  const year = d.getUTCFullYear();
  return d.getUTCMonth() + 1 >= 8 ? year : year - 1;
}
