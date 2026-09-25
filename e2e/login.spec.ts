import { test, expect, type Page } from "@playwright/test";
import { getMagicLinkFor } from "./helpers/mailpit";

// Bypasses the login form's native HTML5 validation (required/type="email"),
// which would otherwise block submitting empty or malformed values before
// they ever reach the server - needed to exercise our own server-side
// error handling for those same cases.
async function disableClientValidation(page: Page) {
  await page.evaluate(() => {
    document.querySelector("form")?.setAttribute("novalidate", "");
  });
}

test("magic link sign-in and sign-out", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send magic link" }).click();

  await expect(
    page.getByText("Check your email for a sign-in link.")
  ).toBeVisible();

  const magicLink = await getMagicLinkFor(email);
  await page.goto(magicLink);

  await expect(page).toHaveURL("/");
  await expect(
    page.getByText("Please select a school from the button above to volunteer for a time slot.")
  ).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();

  await expect(page).toHaveURL("/login");
  await expect(
    page.getByRole("button", { name: "Send magic link" })
  ).toBeVisible();
});

test("shows an error when the email field is empty", async ({ page }) => {
  await page.goto("/login");
  await disableClientValidation(page);
  await page.getByRole("button", { name: "Send magic link" }).click();

  await expect(page).toHaveURL(/error=missing-email/);
  await expect(page.getByText("Enter your email address.")).toBeVisible();
});

test("shows an error when Supabase rejects the email", async ({ page }) => {
  await page.goto("/login");
  await disableClientValidation(page);
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByRole("button", { name: "Send magic link" }).click();

  await expect(page).toHaveURL(/error=invalid-email/);
  await expect(
    page.getByText("That doesn't look like a valid email address.")
  ).toBeVisible();
  // The user can fix this themselves, so no "contact us" line.
  await expect(page.getByText("Still stuck?")).toHaveCount(0);
});

test("shows an error when the callback route is hit without a code", async ({
  page,
}) => {
  await page.goto("/auth/callback");

  await expect(page).toHaveURL(/error=callback-failed/);
  await expect(
    page.getByText(/That sign-in link didn't work/)
  ).toBeVisible();
  await expect(page.getByText("missing_code")).toBeVisible();
});

test("says so when Supabase reports the link as expired or already used", async ({
  page,
}) => {
  await page.goto(
    "/auth/callback?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired"
  );

  await expect(page).toHaveURL(/error=link-expired/);
  await expect(
    page.getByText("That sign-in link has expired or has already been used.")
  ).toBeVisible();
  // The technical code is shown so it can be quoted when asking for help.
  await expect(page.getByText("otp_expired")).toBeVisible();
  await expect(page.getByRole("link", { name: "help@camstreets.org" })).toBeVisible();
});

test("explains a link opened in a different browser from the one that asked for it", async ({
  page,
}) => {
  // A fresh browser has no stored sign-in request, exactly like opening the
  // emailed link somewhere other than where it was requested.
  await page.goto("/auth/callback?code=00000000-0000-0000-0000-000000000000");

  await expect(page).toHaveURL(/error=wrong-browser/);
  await expect(
    page.getByText(/opened in a different browser or device/)
  ).toBeVisible();
  await expect(page.getByText("pkce_code_verifier_not_found")).toBeVisible();
});

test("says a link is expired or used when its code is no longer valid", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("volunteer@example.com");
  await page.getByRole("button", { name: "Send magic link" }).click();
  await expect(page.getByText("Check your email for a sign-in link.")).toBeVisible();

  // This browser did ask for a link, but this code isn't one Supabase issued.
  await page.goto("/auth/callback?code=00000000-0000-0000-0000-000000000000");

  await expect(page).toHaveURL(/error=link-expired/);
  await expect(page.getByText("flow_state_not_found")).toBeVisible();
});
