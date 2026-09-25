// Magic-link landing route: exchanges the ?code from the emailed link for a
// real session (setting cookies), then redirects into or back out of the app.
// Failures go back to /login with a specific reason (see lib/authErrors.ts).
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { classifyLinkError, loginErrorUrl } from "@/lib/authErrors";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Supabase sends the user here with these set when its own check of the
  // link failed (for example an expired link), instead of a code.
  const providerErrorCode = searchParams.get("error_code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}/`);
    }

    console.error(
      "[auth callback] code exchange failed: " +
        JSON.stringify({ code: error.code ?? null, name: error.name, status: error.status ?? null, message: error.message })
    );
    return NextResponse.redirect(`${origin}${loginErrorUrl(classifyLinkError({ error }))}`);
  }

  console.error(
    "[auth callback] no code in request: " +
      JSON.stringify({ error_code: providerErrorCode, error: searchParams.get("error"), description: searchParams.get("error_description") })
  );
  const problem = providerErrorCode
    ? classifyLinkError({ providerErrorCode })
    : { key: "callback-failed", ref: "missing_code" };
  return NextResponse.redirect(`${origin}${loginErrorUrl(problem)}`);
}
