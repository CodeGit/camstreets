import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createLocation, deleteLocation, createSlot, deleteSlot } from "./locationsActions";

type Slot = { id: number; label: string; start_time: string; end_time: string; capacity: number };

// A "slot" is stored as one row per weekday (createSlot always creates
// Monday..Friday together), grouped back into a single displayed row here
// by (label, start_time, end_time, capacity) - same idea as terms being
// two half-term rows shown as one 4-date term.
function groupSlots(slots: Slot[]): { ids: number[]; label: string; start_time: string; end_time: string; capacity: number }[] {
  const groups = new Map<string, { ids: number[]; label: string; start_time: string; end_time: string; capacity: number }>();
  for (const slot of slots) {
    const key = `${slot.label}|${slot.start_time}|${slot.end_time}|${slot.capacity}`;
    const existing = groups.get(key);
    if (existing) {
      existing.ids.push(slot.id);
    } else {
      groups.set(key, {
        ids: [slot.id],
        label: slot.label,
        start_time: slot.start_time,
        end_time: slot.end_time,
        capacity: slot.capacity,
      });
    }
  }
  return [...groups.values()].sort((a, b) => a.start_time.localeCompare(b.start_time));
}

export default async function LocationsAndSlots({ schoolId }: { schoolId: number }) {
  const supabase = await createClient();

  const { data: locations } = await supabase
    .from("locations")
    .select("*, slots(*)")
    .eq("school_id", schoolId)
    .order("name");

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium">Locations</h3>
        <p className="text-sm text-muted-foreground">
          Each location has its own weekly slots (e.g. Morning drop-off,
          Afternoon pickup - every weekday, same time) with a minimum
          occupancy - how many volunteers this slot needs.
        </p>
      </div>

      {(locations ?? []).length === 0 && (
        <p className="text-muted-foreground">No locations set up yet.</p>
      )}

      {(locations ?? []).map((location) => {
        const slots = groupSlots(location.slots);

        return (
          <div
            key={location.id}
            className="space-y-3 rounded-xl border border-border bg-muted/40 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-foreground">{location.name}</div>
                {location.address && (
                  <div className="text-sm text-muted-foreground">{location.address}</div>
                )}
              </div>
              <form action={deleteLocation.bind(null, location.id)}>
                <Button type="submit" variant="destructive" size="sm">
                  Delete location
                </Button>
              </form>
            </div>

            <ul className="space-y-2">
              {slots.map((slot) => (
                <li
                  key={slot.ids.join("-")}
                  className="flex items-center justify-between border-b border-border py-2"
                >
                  <div>
                    <div className="font-medium">{slot.label}</div>
                    <div className="text-sm text-muted-foreground">
                      Weekdays · {slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)} · min{" "}
                      {slot.capacity} volunteer{slot.capacity === 1 ? "" : "s"}
                    </div>
                  </div>
                  <form action={deleteSlot.bind(null, slot.ids)}>
                    <Button type="submit" variant="destructive" size="sm">
                      Delete
                    </Button>
                  </form>
                </li>
              ))}
              {slots.length === 0 && (
                <p className="text-sm text-muted-foreground">No slots yet.</p>
              )}
            </ul>

            <form
              action={createSlot.bind(null, location.id)}
              className="space-y-3 border-t border-border pt-3"
            >
              <h4 className="text-sm font-medium text-muted-foreground">
                Add a slot (runs every weekday)
              </h4>
              <div className="space-y-2">
                <Label htmlFor={`slot_label_${location.id}`}>Label</Label>
                <Input
                  id={`slot_label_${location.id}`}
                  name="label"
                  placeholder="Morning drop-off"
                  required
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="space-y-2 flex-1">
                  <Label htmlFor={`slot_start_${location.id}`}>Starts</Label>
                  <Input id={`slot_start_${location.id}`} name="start_time" type="time" required />
                </div>
                <div className="space-y-2 flex-1">
                  <Label htmlFor={`slot_end_${location.id}`}>Ends</Label>
                  <Input id={`slot_end_${location.id}`} name="end_time" type="time" required />
                </div>
                <div className="space-y-2 flex-1">
                  <Label htmlFor={`slot_capacity_${location.id}`}>Minimum number of volunteers</Label>
                  <Input
                    id={`slot_capacity_${location.id}`}
                    name="capacity"
                    type="number"
                    min={1}
                    defaultValue={1}
                    required
                  />
                </div>
              </div>
              <Button type="submit" size="sm">
                Add slot
              </Button>
            </form>
          </div>
        );
      })}

      <form
        action={createLocation.bind(null, schoolId)}
        className="space-y-3 border-t border-border pt-4"
      >
        <h4 className="text-sm font-medium">Add a location</h4>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="space-y-2 flex-1">
            <Label htmlFor="location_name">Name</Label>
            <Input id="location_name" name="name" required />
          </div>
          <div className="space-y-2 flex-1">
            <Label htmlFor="location_address">Address (optional)</Label>
            <Input id="location_address" name="address" />
          </div>
        </div>
        <Button type="submit">Add location</Button>
      </form>
    </div>
  );
}
