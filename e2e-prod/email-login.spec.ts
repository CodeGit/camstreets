import { test, expect } from "@playwright/test";
import { waitForSignInEmail } from "./mailbox";

// Full real sign-in, including email delivery: the login form, Supabase
// Auth, SMTP2GO, the inbox, the emailed link, /auth/callback and the
// resulting session. Sends a real email, so it runs only a few times a day
// (see .github/workflows/prod-email-login.yml) - SMTP2GO's monthly
// allowance is the limit, not GitHub Actions.

const email = process.env.MONITOR_EMAIL;
const haveMailbox = process.env.MAIL_SOURCE === "mailpit" || (process.env.IMAP_HOST && process.env.IMAP_USER && process.env.IMAP_PASSWORD);

test.skip(!email || !haveMailbox, "MONITOR_EMAIL / IMAP_* not configured - email-login probe skipped");

// No retry for this one test. A failed attempt has usually still sent the
// email (the send can be slow - see below), and Supabase only allows one
// sign-in email to the same address per 60 seconds - so a retry seconds
// later is rejected, and one slow send shows up as two failures. Let it fail
// once, clearly, and let the next scheduled run be the retry.
test.describe.configure({ retries: 0 });

test("magic-link sign-in works end to end, including email delivery", async ({ page }) => {
  // Room for the slowest allowed path: up to 60s waiting for the send, then
  // up to 120s waiting for the email (mailbox.ts), plus the page steps.
  // Without this the shared 90s limit would cut a slow run off with a bare
  // "Test timeout" instead of the specific failure.
  test.setTimeout(240_000);

  const requestedAt = new Date();

  await page.goto("/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByRole("button", { name: "Send magic link" }).click();

  const sent = page.getByText("Check your email for a sign-in link.");
  // Scoped to the login page's own error banner (Alert, ui/alert.tsx), not
  // page.getByRole("alert") - that also matches Next.js's own always-present,
  // empty route-announcer element (for screen-reader page-change
  // announcements), which is a false positive here every single time.
  const failed = page.locator('[data-slot="alert"]').filter({ hasNotText: "Check your email" });
  await expect(sent.or(failed)).toBeVisible({ timeout: 60_000 });
  if (await failed.isVisible()) {
    // Names the actual cause (e.g. "Too many sign-in emails have been
    // requested...") instead of a bare "element not found" - see
    // src/lib/authErrors.ts for what these messages mean and src/app/login/page.tsx
    // for where they're shown, including the Supabase error code alongside
    // the message.
    throw new Error(`Sending the sign-in email failed: ${await failed.innerText()}`);
  }

  const mail = await waitForSignInEmail(email!, requestedAt);

  // Catches sender/template drift on the hosted project (its email
  // template is edited by hand in the dashboard - see TODO.md).
  expect(mail.subject).toBe("Your sign-in link");
  expect(mail.html).toContain("expires in 24 hours");
  if (process.env.MAIL_SOURCE !== "mailpit") {
    expect(mail.from).toContain("login@camstreets.org");
  }

  await page.goto(mail.link);
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible();

  await page.getByRole("button", { name: /Log out/ }).click();
  await expect(page.getByRole("link", { name: /Please log in/ })).toBeVisible();
});
