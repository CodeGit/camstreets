// The site's own origin, for building absolute URLs server-side (an
// emailed magic link, a calendar feed URL) where a relative path won't
// do. Shared by login/actions.ts and calendarFeedLink.tsx.
export function getOrigin() {
  if (process.env.VERCEL_ENV === "production") {
    return "https://www.camstreets.org";
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
