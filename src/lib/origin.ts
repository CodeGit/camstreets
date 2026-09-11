import { headers } from "next/headers";

// The site's own origin, for building absolute URLs server-side (an
// emailed magic link, a calendar feed URL) where a relative path won't
// do. Shared by login/actions.ts and calendarFeedLink.tsx.
//
// Reads the incoming request's own Host header rather than guessing from
// VERCEL_ENV/VERCEL_URL - those only ever resolve to
// "production"/Vercel's own ephemeral per-deployment hostname, never a
// custom domain like dev.camstreets.org. That mismatch is a real bug: a
// magic link requested while browsing dev.camstreets.org (PKCE verifier
// cookie stored under that domain) would get emailed a link pointing at a
// *different* vercel.app hostname, landing on a domain with no matching
// stored verifier - which Supabase reports as a generic "didn't work,
// maybe a different browser" failure. Host-header-based origin works
// correctly for prod, dev, and any future custom domain with no
// hardcoded domain list to keep in sync.
export async function getOrigin() {
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  const protocol = host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https";
  return `${protocol}://${host}`;
}
