"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const INITIAL_ROWS = 5;

// Compact, table-style entry for inset days - a "#"/Date/Notes row per
// slot, with an "Add row" button for schools that need more than the
// initial 5. Row-adding needs client state, so this piece (only this
// piece) is a client component; the actual submit still goes straight to
// the server action, same as everywhere else in this app.
export default function InsetDaysForm({
  action,
}: {
  action: (formData: FormData) => void;
}) {
  const [rowCount, setRowCount] = useState(INITIAL_ROWS);
  const rows = Array.from({ length: rowCount }, (_, i) => i + 1);

  return (
    <form action={action} className="space-y-3 border-t border-border pt-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="w-8 pb-1 font-normal">#</th>
              <th className="pb-1 pr-2 font-normal">Date</th>
              <th className="pb-1 font-normal">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row}>
                <td className="py-1 pr-2 text-muted-foreground">{row}</td>
                <td className="py-1 pr-2">
                  <Input
                    aria-label={`Inset day ${row} date`}
                    name={`inset_date_${row}`}
                    type="date"
                    className="h-8"
                  />
                </td>
                <td className="py-1">
                  <Input
                    aria-label={`Inset day ${row} notes`}
                    name={`inset_label_${row}`}
                    placeholder="Optional"
                    className="h-8"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setRowCount((count) => count + 1)}
        >
          Add row
        </Button>
        <Button type="submit" size="sm">
          Add inset days
        </Button>
      </div>
    </form>
  );
}
