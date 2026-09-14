"use client";

import { useRef } from "react";

// A thin client-side wrapper around the mobile day-swipe carousel in
// week.tsx, split into its own file because it needs "use client" for the
// keyboard handler - week.tsx itself stays a plain server-rendered
// function, and its `instancesByDate` Map prop (not serialisable across
// the server/client boundary) never has to cross into client code, only
// the already-rendered WeekDayPanel elements passed in as `children`.
//
// Touch swiping already works natively via CSS scroll-snap with no JS at
// all. This only adds the keyboard-equivalent: without it, there was no
// way to move between days without a touchscreen or a mouse drag.
export default function WeekDayCarousel({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  function stepWidth(el: HTMLDivElement) {
    // Distance between two adjacent panels' offsetLeft, rather than
    // re-deriving it from the 92%-width/gap-3 values in week.tsx - stays
    // correct automatically if either of those ever changes.
    const first = el.children[0] as HTMLElement | undefined;
    const second = el.children[1] as HTMLElement | undefined;
    return second && first ? second.offsetLeft - first.offsetLeft : el.clientWidth;
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      el.scrollBy({ left: stepWidth(el), behavior: "smooth" });
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      el.scrollBy({ left: -stepWidth(el), behavior: "smooth" });
    }
    // Any other key (including Up/Down) is left alone - this only adds a
    // horizontal-day equivalent to the swipe gesture, not a replacement
    // for normal page scrolling.
  }

  return (
    <div
      ref={ref}
      tabIndex={0}
      role="region"
      aria-label="Days this week - swipe or use the left/right arrow keys to move between days"
      onKeyDown={handleKeyDown}
      className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:hidden"
    >
      {children}
    </div>
  );
}
