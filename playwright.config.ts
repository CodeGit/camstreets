import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // Sequential, not parallel: every spec file runs against the same local
  // Supabase stack (one Postgres instance, one Mailpit inbox), reusing a
  // handful of fixed seeded accounts (superuser@/admin@/volunteer@
  // example.com). Running files concurrently let two different files'
  // magic-link requests for the same address race in Mailpit (whichever
  // arrived first could get consumed by the wrong test), and let unrelated
  // signups on the same slot instance pollute each other's coverage
  // badges - both real, repeated sources of flakiness, not product bugs.
  // One worker trades total run time for eliminating that whole class of
  // failure at the root.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
