import { type Page, expect } from "@playwright/test";
import { getMagicLinkFor } from "./mailpit";

// Signs in via the real magic-link flow (Mailpit), reusing an existing
// seeded auth.users row rather than creating a fresh one each time — see
// supabase/seed.sql for the role-named test accounts (superuser@,
// admin@, volunteer@example.com).
export async function signInAs(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send magic link" }).click();
  await expect(
    page.getByText("Check your email for a sign-in link.")
  ).toBeVisible();

  const magicLink = await getMagicLinkFor(email);
  await page.goto(magicLink);
  await expect(page).toHaveURL("/");
}
