// Deterministic per-volunteer badge colour: same volunteer_id always maps
// to the same swatch, computed on the fly rather than stored anywhere, so
// there's nothing to keep in sync if a volunteer renames themselves.
// Collisions (two different volunteers landing on the same swatch) are
// expected and fine on their own - they only actually confuse anyone when
// paired with a matching display_name too, which is what the "you look
// identical to someone else here" check (schoolWeekCalendar.tsx) looks for
// rather than trying to avoid colour collisions altogether.

// Tailwind's class scanner only picks up literal strings it can see in
// source, not ones built from a template at runtime - so this stays a
// hardcoded array rather than `bg-badge-${n}-bg`.
const BADGE_CLASSES = [
  "bg-badge-1-bg text-badge-1",
  "bg-badge-2-bg text-badge-2",
  "bg-badge-3-bg text-badge-3",
  "bg-badge-4-bg text-badge-4",
  "bg-badge-5-bg text-badge-5",
  "bg-badge-6-bg text-badge-6",
  "bg-badge-7-bg text-badge-7",
  "bg-badge-8-bg text-badge-8",
  "bg-badge-9-bg text-badge-9",
  "bg-badge-10-bg text-badge-10",
];

export function volunteerColorIndex(volunteerId: string): number {
  let hash = 0;
  for (let i = 0; i < volunteerId.length; i++) {
    hash = (hash * 31 + volunteerId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % BADGE_CLASSES.length;
}

export function volunteerBadgeClass(volunteerId: string): string {
  return BADGE_CLASSES[volunteerColorIndex(volunteerId)];
}
