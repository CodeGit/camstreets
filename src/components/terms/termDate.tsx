import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteOffDay } from "./actions";

// A "term" for display purposes: 4 dates (start, half-term start/end, end).
// `ids` holds the underlying row id(s) to delete when this term is
// removed - a single id for default_terms (which already has this exact
// shape), or two for a school's own terms (still stored as two separate
// half-term rows under the hood - see termTimes.tsx, which pairs them into
// this shape for display without changing that table's schema).
export type TermDateEntry = {
  ids: number[];
  name: string;
  start_date: string;
  half_term_start: string;
  half_term_end: string;
  end_date: string;
};

export type OffDayEntry = {
  id: number;
  type: "bank_holiday" | "inset_day";
  date: string;
  label: string | null;
};

// Shared display for one academic year's worth of terms, reused by both
// the superuser's default_terms editor and a school's own term times -
// single source of truth for this layout rather than two components that
// slowly diverge. `offDays` is optional: pass it (inset days + bank
// holidays for this year) to show the collapsible list, or omit it to
// leave that out entirely (the default_terms editor isn't school-scoped,
// so inset days don't apply there, and bank holidays get their own
// separate editor). `onEditTerm` is also optional - default_terms only
// supports add-a-year/delete, but a school needs to adjust its
// auto-populated dates if it diverges from the default, so termTimes.tsx
// passes this and default_terms.tsx doesn't.
export default function TermDate({
  year,
  terms,
  offDays,
  onDeleteTerm,
  onEditTerm,
  children,
}: {
  year: number;
  terms: TermDateEntry[];
  offDays?: OffDayEntry[];
  onDeleteTerm: (ids: number[]) => Promise<void>;
  onEditTerm?: (ids: number[], formData: FormData) => Promise<void>;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
      <h3 className="text-xl font-bold text-foreground">
        {year}/{year + 1}
      </h3>
      <ul className="space-y-2">
        {terms.map((term) => (
          <li key={term.ids.join("-")} className="border-b border-border py-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{term.name}</div>
                <div className="text-sm text-muted-foreground">
                  {term.start_date} – {term.half_term_start}, half term, {term.half_term_end} –{" "}
                  {term.end_date}
                </div>
              </div>
              <form action={onDeleteTerm.bind(null, term.ids)}>
                <Button type="submit" variant="destructive" size="sm">
                  Delete
                </Button>
              </form>
            </div>

            {onEditTerm && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Edit dates
                </summary>
                <form
                  action={onEditTerm.bind(null, term.ids)}
                  className="mt-2 flex flex-col sm:flex-row gap-3"
                >
                  <div className="space-y-1 flex-1">
                    <Label htmlFor={`start_date_${term.ids.join("-")}`}>Term start</Label>
                    <Input
                      id={`start_date_${term.ids.join("-")}`}
                      name="start_date"
                      type="date"
                      defaultValue={term.start_date}
                      required
                    />
                  </div>
                  <div className="space-y-1 flex-1">
                    <Label htmlFor={`half_term_start_${term.ids.join("-")}`}>Half term start</Label>
                    <Input
                      id={`half_term_start_${term.ids.join("-")}`}
                      name="half_term_start"
                      type="date"
                      defaultValue={term.half_term_start}
                      required
                    />
                  </div>
                  <div className="space-y-1 flex-1">
                    <Label htmlFor={`half_term_end_${term.ids.join("-")}`}>Half term end</Label>
                    <Input
                      id={`half_term_end_${term.ids.join("-")}`}
                      name="half_term_end"
                      type="date"
                      defaultValue={term.half_term_end}
                      required
                    />
                  </div>
                  <div className="space-y-1 flex-1">
                    <Label htmlFor={`end_date_${term.ids.join("-")}`}>Term end</Label>
                    <Input
                      id={`end_date_${term.ids.join("-")}`}
                      name="end_date"
                      type="date"
                      defaultValue={term.end_date}
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" size="sm">
                      Save
                    </Button>
                  </div>
                </form>
              </details>
            )}
          </li>
        ))}
      </ul>

      {offDays && offDays.length > 0 && (
        <details className="rounded-lg border border-border px-3 py-2">
          <summary className="cursor-pointer text-sm font-medium">
            Inset days &amp; bank holidays ({offDays.length})
          </summary>
          <ul className="mt-2 space-y-1">
            {offDays.map((day) => (
              <li key={day.id} className="flex items-center justify-between py-1 text-sm">
                <span>
                  <span className="text-muted-foreground">{day.date}</span>{" "}
                  {day.label ?? (day.type === "bank_holiday" ? "Bank holiday" : "Inset day")}
                  <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    {day.type === "bank_holiday" ? "Bank holiday" : "Inset day"}
                  </span>
                </span>
                <form action={deleteOffDay.bind(null, day.id)}>
                  <Button type="submit" variant="destructive" size="sm">
                    Delete
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        </details>
      )}

      {children}
    </div>
  );
}
