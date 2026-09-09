import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addBankHoliday, deleteOffDay, refreshBankHolidays } from "./actions";

// Superuser-managed bank holidays (off_days.type = 'bank_holiday',
// school_id null — see supabase/migrations/20260909102854_add_off_days.sql).
// Two ways to add one: "Refresh from gov.uk" pulls in anything new from
// the published dataset, or add one manually for a not-yet-announced,
// ad-hoc holiday (e.g. a monarch's death/coronation) that gov.uk hasn't
// caught up with yet.
export default async function BankHolidays() {
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

  const { data: holidays } = await supabase
    .from("off_days")
    .select("*")
    .eq("type", "bank_holiday")
    .order("date");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Bank holidays</h2>
          <p className="text-sm text-muted-foreground">
            Excluded when a term is published, across every school.
          </p>
        </div>
        <form action={refreshBankHolidays}>
          <Button type="submit" variant="outline" size="sm">
            Refresh from gov.uk
          </Button>
        </form>
      </div>

      <ul className="space-y-2">
        {(holidays ?? []).map((holiday) => (
          <li
            key={holiday.id}
            className="flex items-center justify-between border-b border-border py-2"
          >
            <div>
              <div className="font-medium">{holiday.label}</div>
              <div className="text-sm text-muted-foreground">{holiday.date}</div>
            </div>
            <form action={deleteOffDay.bind(null, holiday.id)}>
              <Button type="submit" variant="destructive" size="sm">
                Delete
              </Button>
            </form>
          </li>
        ))}
        {(holidays ?? []).length === 0 && (
          <p className="text-muted-foreground">No bank holidays set yet.</p>
        )}
      </ul>

      <form action={addBankHoliday} className="space-y-3 border-t border-border pt-4">
        <h3 className="text-sm font-medium">Add manually</h3>
        <div className="space-y-2">
          <Label htmlFor="label">Name</Label>
          <Input id="label" name="label" placeholder="Additional bank holiday" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" required />
        </div>
        <Button type="submit">Add bank holiday</Button>
      </form>
    </div>
  );
}
