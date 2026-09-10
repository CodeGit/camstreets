import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { signInAs } from "./helpers/auth";

// One-off claim/cancel and regular claim/cancel (both cancellation modes),
// exercised for all three account tiers - signing up for a slot is meant to
// work identically regardless of admin/superuser status (the RLS policy
// gating it, "volunteers can sign themselves up" in
// 20260801122733_add_volunteer_schools.sql, has no is_superuser() bypass:
// every role needs the same volunteer_schools membership, which claimSlot
// auto-creates - see src/components/schedule/actions.ts).
test.describe.configure({ mode: "serial" });

// Fixed local-stack default service-role key (printed by `supabase
// start`), used to force a clean slate before each role's flow - never
// valid against a hosted project. Same pattern as other e2e specs.
const serviceClient = createClient(
  "http://127.0.0.1:54321",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
);

const ROLES = [
  {
    label: "superuser",
    email: "superuser@example.com",
    volunteerId: "a0000000-0000-0000-0000-000000000003",
    location: "Newnham Road crossing point",
    timeFilter: "08:15",
  },
  {
    label: "admin",
    email: "admin@example.com",
    volunteerId: "a0000000-0000-0000-0000-000000000004",
    location: "Newnham Road crossing point",
    timeFilter: "15:00",
  },
  {
    label: "standard volunteer",
    email: "volunteer@example.com",
    volunteerId: "a0000000-0000-0000-0000-000000000005",
    location: "Grantchester Street crossing",
    timeFilter: "15:00",
  },
];

const WEEK_0 = "2026-11-02";
const WEEK_1 = "2026-11-09";
const WEEK_2 = "2026-11-16";

function cardLocator(page: Page, location: string, timeFilter: string) {
  return page.locator("button.border-l-4", { hasText: location }).filter({ hasText: timeFilter }).first();
}

// isRegularCommitment (page.tsx) counts a volunteer's confirmed signups for
// a slot with no date filter at all, and the coverage badge shown on a
// slot_instance aggregates *every* volunteer confirmed on it - so a role's
// very first assertion here ("Needs volunteers", i.e. zero confirmed) can
// be broken by an *unrelated* spec file's test signed in as a *different*
// account that happens to leave a lasting signup on the same slot (e.g. a
// "regular" claim, which - unlike a one-off - extends indefinitely into
// the future, well past whatever specific dates that other test explicitly
// checks). Rather than hunt for a combination every other file's tests
// will never touch on any date (a losing game as more specs get added),
// force every volunteer's signup back to cancelled for this role's target
// slot on exactly the dates this file uses - narrow enough to leave other
// files' own assertions about their own dates alone.
async function resetSignupsFor(location: string, timeFilter: string, dates: string[]) {
  const { data: slots } = await serviceClient
    .from("slots")
    .select("id, locations!inner(name)")
    .eq("locations.name", location)
    .eq("start_time", `${timeFilter}:00`);
  const slotIds = (slots ?? []).map((s) => s.id);
  if (slotIds.length === 0) return;

  const { data: instances } = await serviceClient
    .from("slot_instances")
    .select("id")
    .in("slot_id", slotIds)
    .in("date", dates);
  const instanceIds = (instances ?? []).map((i) => i.id);
  if (instanceIds.length === 0) return;

  await serviceClient
    .from("signups")
    .update({ status: "cancelled" })
    .in("slot_instance_id", instanceIds);
}

for (const role of ROLES) {
  test.describe(`${role.label} (${role.email})`, () => {
    test("can claim a one-off slot and cancel it", async ({ page }) => {
      await resetSignupsFor(role.location, role.timeFilter, [WEEK_0]);
      await signInAs(page, role.email);
      await page.goto(`/schools/1?date=${WEEK_0}`);

      const card = cardLocator(page, role.location, role.timeFilter);
      await expect(card).toHaveAccessibleName(/Needs volunteers/);

      // (Whether the "you'll also be added as a volunteer" disclosure shows
      // here depends on whether this account is already a member of the
      // school, which - for admin@/superuser@ - other spec files can also
      // affect when run in parallel; that specific disclosure behaviour is
      // covered in isolation by join-on-signup.spec.ts, so it's not
      // re-asserted here.)
      await card.click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByText("One-off - just this date")).toBeVisible();

      // "One-off" is the pre-selected default - just confirm.
      await page.getByRole("button", { name: "OK" }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(cardLocator(page, role.location, role.timeFilter)).toHaveAccessibleName(
        /Needs more volunteers/
      );

      // A single one-off signup isn't an "ongoing commitment" yet, so
      // cancelling shows the plain confirmation, not the extended choice.
      await cardLocator(page, role.location, role.timeFilter).click();
      await expect(page.getByText("Cancel this signup?")).toBeVisible();
      await expect(page.getByText("Just this date")).toHaveCount(0);
      await page.getByRole("button", { name: "Cancel signup" }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(cardLocator(page, role.location, role.timeFilter)).toHaveAccessibleName(
        /Needs volunteers/
      );
    });

    test("can claim a regular slot spanning future weeks, then cancel one date vs. this-and-future", async ({
      page,
    }) => {
      await resetSignupsFor(role.location, role.timeFilter, [WEEK_0, WEEK_1, WEEK_2]);
      await signInAs(page, role.email);
      await page.goto(`/schools/1?date=${WEEK_0}`);

      await cardLocator(page, role.location, role.timeFilter).click();
      await page.getByLabel("Regular - every week for the rest of the academic year").check();
      await page.getByRole("button", { name: "OK" }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(cardLocator(page, role.location, role.timeFilter)).toHaveAccessibleName(
        /Needs more volunteers/
      );

      // A later week is also confirmed - the whole point of "regular".
      await page.goto(`/schools/1?date=${WEEK_2}`);
      await expect(cardLocator(page, role.location, role.timeFilter)).toHaveAccessibleName(
        /Needs more volunteers/
      );

      // Cancel the middle week via "just this date" - an ongoing commitment
      // (2+ confirmed dates) now offers the extended choice.
      await page.goto(`/schools/1?date=${WEEK_1}`);
      const midWeekCard = cardLocator(page, role.location, role.timeFilter);
      await midWeekCard.click();
      await expect(page.getByText("Just this date")).toBeVisible();
      await expect(page.getByText("This and all future dates")).toBeVisible();
      await page.getByRole("button", { name: "Cancel" }).click(); // "Just this date" is the default
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(cardLocator(page, role.location, role.timeFilter)).toHaveAccessibleName(
        /Needs volunteers/
      );

      // The earlier and later weeks are untouched by that single-date cancel.
      await page.goto(`/schools/1?date=${WEEK_0}`);
      await expect(cardLocator(page, role.location, role.timeFilter)).toHaveAccessibleName(
        /Needs more volunteers/
      );
      await page.goto(`/schools/1?date=${WEEK_2}`);
      await expect(cardLocator(page, role.location, role.timeFilter)).toHaveAccessibleName(
        /Needs more volunteers/
      );

      // Cancel the later week via "this and all future dates".
      const laterWeekCard = cardLocator(page, role.location, role.timeFilter);
      await laterWeekCard.click();
      await page.getByLabel("This and all future dates").check();
      await page.getByRole("button", { name: "Cancel" }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(cardLocator(page, role.location, role.timeFilter)).toHaveAccessibleName(
        /Needs volunteers/
      );

      // The earliest week, before the cancel-from date, is untouched.
      await page.goto(`/schools/1?date=${WEEK_0}`);
      await expect(cardLocator(page, role.location, role.timeFilter)).toHaveAccessibleName(
        /Needs more volunteers/
      );
    });
  });
}
