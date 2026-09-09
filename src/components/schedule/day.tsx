import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { Tables } from "@/lib/supabase/database.types";

export type ScheduleInstance = Tables<"slot_instances"> & {
  slot: Tables<"slots"> & {
    location: Tables<"locations">;
  };
  signups: (Tables<"signups"> & {
    volunteer: Tables<"volunteers">;
  })[];
};

// Date-only strings need a fixed UTC time when parsed, otherwise
// `new Date("2026-09-07")` and the viewer's local timezone can disagree
// about which calendar day it actually is.
function shiftDate(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatLong(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function DaySchedule({
  date,
  hasPublishedTerm,
  instances,
}: {
  date: string;
  hasPublishedTerm: boolean;
  instances: ScheduleInstance[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">{formatLong(date)}</h2>
        <div className="flex gap-2">
          <Link
            href={`?date=${shiftDate(date, -1)}`}
            className={buttonVariants({ variant: "outline", size: "icon" })}
            aria-label="Previous day"
          >
            <ChevronLeft />
          </Link>
          <Link
            href={`?date=${shiftDate(date, 1)}`}
            className={buttonVariants({ variant: "outline", size: "icon" })}
            aria-label="Next day"
          >
            <ChevronRight />
          </Link>
        </div>
      </div>

      {!hasPublishedTerm && (
        <p className="text-muted-foreground">No published term covers this date.</p>
      )}

      {hasPublishedTerm && instances.length === 0 && (
        <p className="text-muted-foreground">
          No crossing patrol slots scheduled for this day.
        </p>
      )}

      <div className="space-y-3">
        {instances.map((instance) => {
          const confirmed = instance.signups.filter((s) => s.status === "confirmed");
          const status =
            confirmed.length >= instance.capacity
              ? "staffed"
              : confirmed.length > 0
                ? "partial"
                : "open";
          const statusLabel =
            status === "staffed"
              ? "Fully staffed"
              : status === "partial"
                ? "Needs more volunteers"
                : "Needs volunteers";

          return (
            <div
              key={instance.id}
              className="flex items-center justify-between rounded-lg border border-border p-4"
            >
              <div>
                <div className="font-medium">{instance.slot.location.name}</div>
                <div className="text-sm text-muted-foreground">
                  {instance.slot.label} · {instance.start_time.slice(0, 5)}–
                  {instance.end_time.slice(0, 5)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    status === "staffed"
                      ? "bg-staffed-bg text-staffed"
                      : status === "partial"
                        ? "bg-partial-bg text-partial"
                        : "bg-open-bg text-open"
                  }`}
                >
                  {statusLabel}
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: instance.capacity }).map((_, i) => {
                    const signup = confirmed[i];
                    return signup ? (
                      <span
                        key={i}
                        title={signup.volunteer.display_name}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-staffed-bg text-xs font-semibold text-staffed"
                      >
                        {signup.volunteer.display_name[0]}
                      </span>
                    ) : (
                      <span
                        key={i}
                        title="Needs a volunteer"
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground"
                      >
                        +
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
