import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { signInAs } from "./helpers/auth";

// Fixed local-stack default service-role key (printed by `supabase
// start`), used to arrange fixture state directly - never valid against a
// hosted project. Same pattern as other e2e specs.
const serviceClient = createClient(
  "http://127.0.0.1:54321",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
);

// dev.camstreets.org's public self-service "become an admin" demo feature
// (src/app/dashboard/actions.ts's becomeDemoAdmin, src/components/
// dashboards/becomeAdminButton.tsx) only grants a school with
// is_demo = true - scripts/seed-demo.mjs is what actually populates those
// against a real hosted project, but a plain `supabase db reset` (what
// this suite runs against) doesn't run it, so there'd otherwise be no
// is_demo school locally at all. Ensuring one exists directly here keeps
// this test self-contained rather than depending on that separate script
// having been run first.
test.beforeAll(async () => {
  const { data: existing } = await serviceClient.from("schools").select("id").eq("is_demo", true).limit(1);
  if (existing && existing.length > 0) return;

  await serviceClient
    .from("schools")
    .insert({ name: "E2E Demo School", street: "Test Street", town: "Testville", is_demo: true });
});

// Requires ALLOW_SELF_ELEVATE=true, which is set in .env.local for local
// dev/e2e - if that's ever unset locally, this test fails closed (button
// absent) rather than silently passing, which is the correct behaviour
// to catch.
test("a plain volunteer can self-elevate to admin of a demo school", async ({ page }) => {
  await signInAs(page, "emily.clarke@example.com");
  await page.goto("/dashboard");

  await expect(page.getByRole("button", { name: "Become an admin (demo)" })).toBeVisible();
  await page.getByRole("button", { name: "Become an admin (demo)" }).click();

  await expect(page.getByRole("tab", { name: "Administer schools" })).toBeVisible({ timeout: 10000 });
  await page.getByRole("tab", { name: "Administer schools" }).click();

  // The specific bug this design avoids: a school_admins-only grant flips
  // is_admin (via the existing sync_volunteer_is_admin() trigger) but
  // AdminDashboard's own school list (inner-joined on volunteer_schools)
  // would render empty without also upserting volunteer_schools.
  await expect(page.getByText("You're not an admin for this school.")).toHaveCount(0);
  await expect(page.locator("h2", { hasText: "Administer" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Volunteers/ })).toBeVisible();
});
