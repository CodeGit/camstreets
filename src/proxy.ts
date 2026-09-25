import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";

// Refreshes the Supabase auth session on every request. Server Components
// can't write cookies themselves (see the comment in
// src/lib/supabase/server.ts), so without this a session silently expires
// once its JWT hits auth.jwt_expiry (1h locally, see supabase/config.toml)
// with nothing to renew it.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getClaims() (not getUser()) is Supabase's current recommendation here -
  // it's what actually triggers the refresh-token exchange when the access
  // token has expired, writing the renewed session back via setAll above.
  const { error } = await supabase.auth.getClaims();

  // A visitor who arrives with a session cookie that can't be refreshed is
  // silently treated as signed out. Log why (Supabase's own error code, e.g.
  // a refresh token that was already used), so an unexplained sign-out
  // report can be matched to a cause in the server logs. Visitors with no
  // session cookie at all are normal and not logged; no email or IP is
  // recorded.
  const hadSessionCookie = request.cookies.getAll().some((cookie) => /^sb-.+-auth-token/.test(cookie.name));
  if (error && hadSessionCookie) {
    console.error(
      "[proxy] session could not be refreshed: " +
        JSON.stringify({
          code: (error as { code?: string }).code ?? null,
          name: error.name,
          path: request.nextUrl.pathname,
          browser: browserFamily(request.headers.get("user-agent")),
        })
    );
  }

  return response;
}

// Coarse browser type only - enough to spot a pattern such as "always iPhone
// Safari" without storing anything that identifies a person.
function browserFamily(userAgent: string | null) {
  if (!userAgent) return "unknown";
  const ios = /iPhone|iPad|iPod/.test(userAgent);
  const safari = /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(userAgent);
  if (ios && safari) return "ios-safari";
  if (ios) return "ios-other-or-in-app";
  if (/Android/.test(userAgent)) return "android";
  if (safari) return "desktop-safari";
  return "other";
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
