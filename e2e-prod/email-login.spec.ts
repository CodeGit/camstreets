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

test("magic-link sign-in works end to end, including email delivery", async ({ page }) => {
  const requestedAt = new Date();

  await page.goto("/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByRole("button", { name: "Send magic link" }).click();
  await expect(page.getByText("Check your email for a sign-in link.")).toBeVisible();

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
