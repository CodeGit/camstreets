import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { signInAs } from "./helpers/auth";

// Fixed local-stack default service-role key (printed by `supabase
// start`), used to verify state with no UI path - never valid against a
// hosted project. Same pattern as other e2e specs.
const serviceClient = createClient(
  "http://127.0.0.1:54321",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
);

// One of Meadowside's volunteers (seed.sql) - a member of that school but
// never added to volunteer_schools for Newnham Croft, the exact scenario
// that used to fail with a "row-level security" error on signups
// (20260801122733_add_volunteer_schools.sql requires membership).
const VOLUNTEER_ID = "a0000000-0000-0000-0000-000000000006";
const VOLUNTEER_EMAIL = "oliver.bennett@example.com";
const NEWNHAM_SCHOOL_ID = 1;

test("signing up as a volunteer not yet in volunteer_schools auto-joins the school, disclosed in the dialog", async ({
  page,
}) => {
  const { data: before } = await serviceClient
    .from("volunteer_schools")
    .select("volunteer_id")
    .eq("volunteer_id", VOLUNTEER_ID)
    .eq("school_id", NEWNHAM_SCHOOL_ID)
    .maybeSingle();
  expect(before).toBeNull();

  await signInAs(page, VOLUNTEER_EMAIL);
  // A different *week* to week-calendar.spec.ts's tests, which also use
  // Grantchester's slots - these two files run in parallel workers against
  // one shared local database, so this needs to land in a completely
  // separate Monday-Friday grid, not just a different day of the same
  // week (the week view always shows the whole Mon-Fri week regardless of
  // which day's date is passed).
  await page.goto("/schools/1?date=2026-10-05");

  const card = page
    .locator("button.border-l-4", { hasText: "Grantchester Street crossing" })
    .filter({ hasText: "08:20" })
    .first();
  await card.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByText("You'll also be added as a volunteer for Newnham Croft Primary.")
  ).toBeVisible();

  await page.getByRole("button", { name: "OK" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(card).toHaveAccessibleName(/Needs\ more\ volunteers/);

  const { data: after } = await serviceClient
    .from("volunteer_schools")
    .select("volunteer_id")
    .eq("volunteer_id", VOLUNTEER_ID)
    .eq("school_id", NEWNHAM_SCHOOL_ID)
    .maybeSingle();
  expect(after).not.toBeNull();

  // Reload: now an existing member, so the dialog no longer discloses a
  // join - and signing up again (a different slot) still works.
  await page.reload();
  const secondCard = page
    .locator("button.border-l-4", { hasText: "Grantchester Street crossing" })
    .filter({ hasText: "15:00" })
    .first();
  await secondCard.click();
  await expect(
    page.getByText("You'll also be added as a volunteer for Newnham Croft Primary.")
  ).toHaveCount(0);
});
