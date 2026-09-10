import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

// Shared prev/next chevron pair for every calendar granularity (day, week,
// month, term) - previously duplicated near-identically in each. A null
// href (e.g. no earlier/later term exists yet) renders a disabled-looking
// placeholder instead of a dead link.
export default function CalendarNav({
  prevHref,
  nextHref,
  prevLabel,
  nextLabel,
}: {
  prevHref: string | null;
  nextHref: string | null;
  prevLabel: string;
  nextLabel: string;
}) {
  return (
    <div className="flex gap-2">
      {prevHref ? (
        <Link href={prevHref} className={buttonVariants({ variant: "outline", size: "icon" })} aria-label={prevLabel}>
          <ChevronLeft />
        </Link>
      ) : (
        <span
          className={buttonVariants({ variant: "outline", size: "icon", className: "opacity-40" })}
          aria-hidden="true"
        >
          <ChevronLeft />
        </span>
      )}
      {nextHref ? (
        <Link href={nextHref} className={buttonVariants({ variant: "outline", size: "icon" })} aria-label={nextLabel}>
          <ChevronRight />
        </Link>
      ) : (
        <span
          className={buttonVariants({ variant: "outline", size: "icon", className: "opacity-40" })}
          aria-hidden="true"
        >
          <ChevronRight />
        </span>
      )}
    </div>
  );
}
