import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { signInAs } from "./helpers/auth";

// Seeded fixtures (supabase/seed.sql): Newnham Croft Primary (id 1) has
// *three* admins out of the box - alex.admin@example.com (directly seeded,
// original core fixture), Vera (auto-promoted to admin as the first
// volunteer_schools joiner), and admin@example.com (directly seeded,
// added later for role-based login testing). Only alex.admin and
// admin@example.com are admin-but-not-volunteer there - Vera is both.
const SCHOOL_ID = 1;
const OTHER_ADMIN_IDS = [
  "a0000000-0000-0000-0000-000000000002", // alex.admin@example.com
  "a0000000-0000-0000-0000-000000000004", // admin@example.com
];

// Bypasses RLS to arrange fixture state directly - there's no UI yet for
// reducing a school down to a single admin (joining/leaving a school isn't
// built), so this is the only way to get a school into that state for the
// last-admin tests below. The key is the fixed local-stack default,
// printed by `supabase start`; never valid against a hosted project.
const serviceClient = createClient(
  "http://127.0.0.1:54321",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
);

test.describe.configure({ mode: "serial" });

// auth.email.max_frequency in supabase/config.toml rate-limits OTP sends to
// the same address to 1/second - these tests reuse the same seeded
// accounts back-to-back, so without this gap a request can arrive within
// that window and silently get rate-limited (see schools-create.spec.ts).
test.beforeEach(async () => {
  await new Promise((resolve) => setTimeout(resolve, 1100));
});

test("admin can view volunteers, toggle a non-last admin, and remove a volunteer", async ({
  page,
}) => {
  await signInAs(page, "admin@example.com");
  // "My calendar" is now the admin dashboard's default tab - ?tab=schools
  // pins it to "Your schools" so the nested Volunteers/Term times/
  // Locations tabs are actually in the DOM.
  await page.goto(`/dashboard?school=${SCHOOL_ID}&tab=schools`);

  await expect(page.getByRole("heading", { name: /Volunteers/ })).toBeVisible();
  // Vera was the first to join, so the auto-promote trigger already made
  // her admin.
  await expect(page.locator("li", { hasText: "Vera" }).getByText("(admin)")).toBeVisible();

  // "Volunteer" (seeded, not admin here) - promote then demote
  const volunteerRow = page.locator("li", { hasText: "Volunteer" });
  await volunteerRow.getByRole("button", { name: "Make admin" }).click();
  await expect(page.locator("li", { hasText: "Volunteer" }).getByText("(admin)")).toBeVisible();
  await page
    .locator("li", { hasText: "Volunteer" })
    .getByRole("button", { name: "Remove admin" })
    .click();
  await expect(page.locator("li", { hasText: "Volunteer" }).getByText("(admin)")).not.toBeVisible();

  // remove "Volunteer" from the school entirely
  await page
    .locator("li", { hasText: "Volunteer" })
    .getByRole("button", { name: "Remove", exact: true })
    .click();
  await expect(page.getByText("Volunteer", { exact: true })).not.toBeVisible();

  // restore for other tests / repeat runs
  await serviceClient.from("volunteer_schools").insert({
    volunteer_id: "a0000000-0000-0000-0000-000000000005",
    school_id: SCHOOL_ID,
  });
});

test("a non-admin volunteer cannot see the volunteer-management view", async ({ page }) => {
  await signInAs(page, "volunteer@example.com");
  await page.goto(`/dashboard?school=${SCHOOL_ID}`);

  await expect(page.getByRole("heading", { name: /Volunteers/ })).not.toBeVisible();
});

test.describe("last-admin guard", () => {
  test.beforeEach(async () => {
    // Reduce school 1 down to a single admin (Vera) so there's a visible,
    // clickable "last admin" row to test the guard against.
    await serviceClient
      .from("school_admins")
      .delete()
      .eq("school_id", SCHOOL_ID)
      .in("volunteer_id", OTHER_ADMIN_IDS);
  });

  test.afterEach(async () => {
    await serviceClient
      .from("school_admins")
      .insert(OTHER_ADMIN_IDS.map((volunteer_id) => ({ school_id: SCHOOL_ID, volunteer_id })));
  });

  test("blocks demoting the sole admin", async ({ page }) => {
    await signInAs(page, "superuser@example.com");
    // "My calendar" is now the superuser dashboard's default tab -
    // tab=schools pins it to "Schools" so the nested Volunteers tab is in
    // the DOM.
    await page.goto(`/dashboard?school=${SCHOOL_ID}&tab=schools`);

    const veraRow = page.locator("li", { hasText: "Vera" });
    await expect(veraRow.getByText("(admin)")).toBeVisible();
    await veraRow.getByRole("button", { name: "Remove admin" }).click();

    await expect(page).toHaveURL(/error=last-admin/);
    await expect(
      page.getByText(/A school must always have at least one admin/)
    ).toBeVisible();
    await expect(page.locator("li", { hasText: "Vera" }).getByText("(admin)")).toBeVisible();
  });

  test("blocks removing the sole admin from the school", async ({ page }) => {
    await signInAs(page, "superuser@example.com");
    // "My calendar" is now the superuser dashboard's default tab -
    // tab=schools pins it to "Schools" so the nested Volunteers tab is in
    // the DOM.
    await page.goto(`/dashboard?school=${SCHOOL_ID}&tab=schools`);

    await page
      .locator("li", { hasText: "Vera" })
      .getByRole("button", { name: "Remove", exact: true })
      .click();

    await expect(page).toHaveURL(/error=last-admin/);
    await expect(page.getByText("Vera")).toBeVisible();
  });
});
