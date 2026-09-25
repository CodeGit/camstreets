import { test, expect } from "@playwright/test";
import { createMonitorSession } from "./support";

// Frequent, email-free liveness probe (every 30 min - see
// .github/workflows/prod-liveness.yml). Read-only apart from signing in as
// the dedicated monitor user.

test("public pages are up", async ({ page }) => {
  const home = await page.goto("/");
  expect(home?.status()).toBe(200);
  await expect(page.getByText("Cambridge school streets volunteer calendar")).toBeVisible();

  const help = await page.goto("/help");
  expect(help?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "How to volunteer" })).toBeVisible();

  const login = await page.goto("/login");
  expect(login?.status()).toBe(200);
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send magic link" })).toBeVisible();
});

test("the school list loads from the database for an anonymous visitor", async ({ page }) => {
  await page.goto("/");
  // Client-side Supabase query - fails if the browser can't reach the
  // database with the public key (bad env var, RLS regression, outage).
  await page.getByRole("combobox").first().click();
  // The placeholder row plus at least one real school - polled, since the
  // list arrives asynchronously after the dropdown opens.
  await expect.poll(() => page.getByRole("option").count(), { timeout: 15_000 }).toBeGreaterThan(1);
});

test("a signed-in session is accepted by the server", async ({ page, context, baseURL }) => {
  const session = await createMonitorSession();
  try {
    await context.addCookies(session.cookies.map(({ name, value }) => ({ name, value, url: baseURL! })));

    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Log out/ })).toBeVisible();

    // A second, server-rendered page also sees the session (the proxy's
    // per-request session refresh didn't reject or drop it).
    await page.goto("/");
    await expect(page.getByRole("button", { name: /Log out/ })).toBeVisible();
  } finally {
    await session.signOut();
  }
});
