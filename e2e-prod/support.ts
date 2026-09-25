import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

// Obtains a real signed-in session for the monitor user without going
// through email: an admin-generated magic link's token hash is verified
// directly, and the resulting session is serialised through @supabase/ssr's
// own cookie logic - so the cookies (names, chunking, encoding) are exactly
// what the app's own sign-in would have set, not a hand-rolled imitation.
//
// This deliberately skips /auth/callback (admin-generated links can't go
// through the PKCE code exchange that route expects) - that path, and the
// login form itself, are covered by email-login.spec.ts instead.
export async function createMonitorSession() {
  const url = requireEnv("SUPABASE_URL");
  const anonKey = requireEnv("SUPABASE_ANON_KEY");
  const email = requireEnv("MONITOR_EMAIL");

  const admin = createClient(url, requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data.properties?.hashed_token) {
    throw new Error(`generateLink failed: ${error?.message ?? "no hashed_token returned"}`);
  }

  const jar = new Map<string, string>();
  const ssr = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (list) => list.forEach(({ name, value }) => jar.set(name, value)),
    },
  });
  const verified = await ssr.auth.verifyOtp({
    token_hash: data.properties.hashed_token,
    type: "magiclink",
  });
  if (verified.error) {
    throw new Error(`verifyOtp failed: ${verified.error.message}`);
  }

  return {
    cookies: [...jar].map(([name, value]) => ({ name, value })),
    // Revokes the session server-side so 48 probes a day don't accumulate
    // as 48 live sessions on the monitor user.
    signOut: async () => {
      await ssr.auth.signOut();
    },
  };
}
