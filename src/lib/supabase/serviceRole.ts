import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Bypasses RLS entirely - only for the calendar feed route
// (src/app/calendar/[token]/feed.ics/route.ts), which needs to look a
// volunteer up *by feed token* with no authenticated session at all (an
// external calendar app fetching the URL sends no cookies/JWT). Never
// import this into anything a browser could reach, and never widen its
// use beyond that one narrow lookup - see the RLS comment on
// volunteer_calendar_feeds for why the token can't be resolved any other
// way.
export function createServiceRoleClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
