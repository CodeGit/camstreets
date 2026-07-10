import { test, expect, type Page } from "@playwright/test";
import { getMagicLinkFor } from "./helpers/mailpit";

// Bypasses the login form's native HTML5 validation (required/type="email"),
// which would otherwise block submitting empty or malformed values before
// they ever reach the server — needed to exercise our own server-side
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
  await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();

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

  await expect(page).toHaveURL(/error=send-failed/);
  await expect(
    page.getByText("Something went wrong sending the link. Try again.")
  ).toBeVisible();
});

test("shows an error when the callback route is hit without a code", async ({
  page,
}) => {
  await page.goto("/auth/callback");

  await expect(page).toHaveURL(/error=callback-failed/);
  await expect(
    page.getByText(/That sign-in link didn't work/)
  ).toBeVisible();
});
