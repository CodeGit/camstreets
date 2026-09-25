"use server";

// Server Action for the login page: sends a Supabase magic-link email and
// redirects back to /login with a status query param for the UI to show.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrigin } from "@/lib/origin";
import { classifySendError, loginErrorUrl } from "@/lib/authErrors";

export async function signInWithMagicLink(formData: FormData) {
  const email = formData.get("email");

  if (typeof email !== "string" || !email) {
    redirect("/login?error=missing-email");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${await getOrigin()}/auth/callback`,
    },
  });

  if (error) {
    // Logged in full (without the email address) so the cause is in the
    // server logs even when the page only shows a friendly message.
    console.error(
      "[login] could not send sign-in email: " +
        JSON.stringify({ code: error.code ?? null, name: error.name, status: error.status ?? null, message: error.message })
    );
    redirect(loginErrorUrl(classifySendError(error)));
  }

  redirect("/login?sent=true");
}
