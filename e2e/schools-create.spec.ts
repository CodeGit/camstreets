import { test, expect, type Page } from "@playwright/test";
import { signInAs } from "./helpers/auth";

// The seeded role accounts (unlike login.spec.ts's unique-per-test emails)
// are reused across these tests, so two tests signing in as the same
// address at once can pick up each other's magic-link email from the
// shared Mailpit inbox. Serial mode avoids that race.
test.describe.configure({ mode: "serial" });

// auth.email.max_frequency in supabase/config.toml rate-limits OTP sends to
// the same address to 1/second — these tests reuse the same seeded
// accounts back-to-back, so without this gap a request can arrive within
// that window and silently get rate-limited.
test.beforeEach(async () => {
  await new Promise((resolve) => setTimeout(resolve, 1100));
});

// Bypasses the form's native HTML5 "required" validation on `name`, so we
// can exercise the server action's own missing-name handling — same idea as
// e2e/login.spec.ts, but scoped to the create-school form specifically:
// this page (unlike /login) renders the navbar, whose own sign-out
// <form> comes first in the DOM, so a bare `document.querySelector("form")`
// grabs the wrong one.
async function disableClientValidation(page: Page) {
  await page.evaluate(() => {
    document
      .querySelector<HTMLInputElement>('input[name="name"]')
      ?.form?.setAttribute("novalidate", "");
  });
}

test("superuser can create a school", async ({ page }) => {
  await signInAs(page, "superuser@example.com");

  await page.goto("/schools/new");
  const schoolName = `Test School ${Date.now()}`;
  await page.getByLabel("School name").fill(schoolName);
  await page.getByLabel("Street").fill("1 Test Street");
  await page.getByLabel("Town/City").fill("Cambridge");
  await page.getByRole("button", { name: "Create school" }).click();

  await expect(page.getByRole("heading", { name: schoolName })).toBeVisible();
});

test("shows an error when the school name is missing", async ({ page }) => {
  await signInAs(page, "superuser@example.com");

  await page.goto("/schools/new");
  await disableClientValidation(page);
  await page.getByRole("button", { name: "Create school" }).click();

  await expect(page).toHaveURL(/error=missing-name/);
  await expect(page.getByText(/Something went wrong/)).toBeVisible();
});

test("redirects non-superusers away from the create-school page", async ({
  page,
}) => {
  await signInAs(page, "volunteer@example.com");

  await page.goto("/schools/new");

  await expect(page).toHaveURL("/");
});

test("redirects signed-out visitors to login", async ({ page }) => {
  await page.goto("/schools/new");

  await expect(page).toHaveURL("/login");
});
