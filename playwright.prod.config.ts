import { defineConfig, devices } from "@playwright/test";

// Liveness probes against the deployed site (default: production) - see
// e2e-prod/ and .github/workflows/prod-*.yml. Deliberately separate from
// playwright.config.ts: no webServer (the site is already running), no
// dependency on the seeded local accounts or Mailpit, and every test here
// must be safe to run repeatedly against real data (read-only, or acting
// only as the dedicated monitor user).
export default defineConfig({
  testDir: "./e2e-prod",
  workers: 1,
  fullyParallel: false,
  // One retry absorbs a single transient network blip without hiding a
  // real outage - two consecutive failures is what should page someone.
  retries: 1,
  timeout: 90_000,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  use: {
    baseURL: process.env.BASE_URL ?? "https://www.camstreets.org",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
