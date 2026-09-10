"use server";

// Server Action for the login page: sends a Supabase magic-link email and
// redirects back to /login with a status query param for the UI to show.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrigin } from "@/lib/origin";

export async function signInWithMagicLink(formData: FormData) {
  const email = formData.get("email");

  if (typeof email !== "string" || !email) {
    redirect("/login?error=missing-email");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${getOrigin()}/auth/callback`,
    },
  });

  if (error) {
    redirect("/login?error=send-failed");
  }

  redirect("/login?sent=true");
}
