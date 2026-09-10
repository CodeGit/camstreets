import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SEASONS = ["autumn", "spring", "summer"] as const;

// Creates a whole academic year (all 3 terms, 12 dates) in one submission
// - replaces the earlier one-season-at-a-time default_terms form. No
// per-term add/edit here by design: a school gets its own terms
// automatically from these (see the on_default_term_created trigger) and
// edits them there if it needs to diverge, so default_terms itself only
// needs add-a-year and delete.
export default function TermYearForm({
  action,
}: {
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="space-y-4 border-t border-border pt-4">
      <h4 className="text-sm font-medium">Add a year</h4>
      {SEASONS.map((season) => (
        <div key={season} className="space-y-2 rounded-lg border border-border p-3">
          <div className="text-sm font-medium capitalize">{season}</div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="space-y-2 flex-1">
              <Label htmlFor={`${season}_start_date`}>Term start</Label>
              <Input id={`${season}_start_date`} name={`${season}_start_date`} type="date" required />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor={`${season}_half_term_start`}>Half term start</Label>
              <Input
                id={`${season}_half_term_start`}
                name={`${season}_half_term_start`}
                type="date"
                required
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor={`${season}_half_term_end`}>Half term end</Label>
              <Input
                id={`${season}_half_term_end`}
                name={`${season}_half_term_end`}
                type="date"
                required
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor={`${season}_end_date`}>Term end</Label>
              <Input id={`${season}_end_date`} name={`${season}_end_date`} type="date" required />
            </div>
          </div>
        </div>
      ))}
      <Button type="submit">Add year</Button>
    </form>
  );
}
