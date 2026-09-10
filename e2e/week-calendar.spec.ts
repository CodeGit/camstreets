import { test, expect } from "@playwright/test";
import { signInAs } from "./helpers/auth";

test.describe.configure({ mode: "serial" });

test("anonymous visitors see the week's coverage but no claim button", async ({ page }) => {
  await page.goto("/schools/1?date=2026-09-07");

  await expect(page.getByRole("heading", { name: "Newnham Croft Primary" })).toBeVisible();
  await expect(page.getByText("Week of 7 September – 11 September 2026")).toBeVisible();
  await expect(page.getByText("Newnham Road crossing point").first()).toBeVisible();
  await expect(page.getByText("Grantchester Street crossing").first()).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  // Anonymous viewers get plain, non-interactive divs, not clickable
  // buttons, for every slot on the grid.
  await expect(page.locator("button.border-l-4")).toHaveCount(0);
});

function newnhamAfternoon(page: import("@playwright/test").Page) {
  return page
    .locator("button.border-l-4", { hasText: "Newnham Road crossing point" })
    .filter({ hasText: "15:00" })
    .first();
}

test("a signed-in volunteer can open the sign-up dialog, choose one-off, and later cancel via the card", async ({
  page,
}) => {
  await signInAs(page, "volunteer@example.com");
  await page.goto("/schools/1?date=2026-09-07");

  const card = newnhamAfternoon(page);
  await expect(card).toHaveAccessibleName(/Needs\ volunteers/);

  // Opens a dialog rather than acting immediately
  await card.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("One-off - just this date")).toBeVisible();
  await expect(page.getByText("Regular - every week for the rest of the academic year")).toBeVisible();

  // Clicking outside the dialog dismisses it without submitting anything
  await page.mouse.click(10, 10);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(newnhamAfternoon(page)).toHaveAccessibleName(/Needs\ volunteers/);

  // Confirming "one-off" (the default choice) signs up just this date
  await newnhamAfternoon(page).click();
  await page.getByRole("button", { name: "OK" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(newnhamAfternoon(page)).toHaveAccessibleName(/Needs\ more\ volunteers/);

  // Clicking the now-signed-up card opens a cancel confirmation instead
  await newnhamAfternoon(page).click();
  await expect(page.getByText("Cancel this signup?")).toBeVisible();
  await page.getByRole("button", { name: "Keep it" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(newnhamAfternoon(page)).toHaveAccessibleName(/Needs\ more\ volunteers/);

  await newnhamAfternoon(page).click();
  await page.getByRole("button", { name: "Cancel signup" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(newnhamAfternoon(page)).toHaveAccessibleName(/Needs\ volunteers/);
});

test("choosing 'regular' signs up every remaining week of the academic year (not just the current term), and a single week can still be cancelled on its own", async ({
  page,
}) => {
  await signInAs(page, "volunteer@example.com");
  await page.goto("/schools/1?date=2026-09-07");

  await newnhamAfternoon(page).click();
  await page.getByLabel("Regular - every week for the rest of the academic year").check();
  await page.getByRole("button", { name: "OK" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(newnhamAfternoon(page)).toHaveAccessibleName(/Needs\ more\ volunteers/);

  // A later week in the same term is also signed up.
  await page.goto("/schools/1?date=2026-09-21");
  await expect(newnhamAfternoon(page)).toHaveAccessibleName(/Needs\ more\ volunteers/);

  // So is a week in a completely different term (Spring 2027) - "regular"
  // covers the whole academic year, not just the term the original claim
  // was made in.
  await page.goto("/schools/1?date=2027-01-11");
  await expect(newnhamAfternoon(page)).toHaveAccessibleName(/Needs\ more\ volunteers/);

  // Cancelling that Spring week doesn't touch the rest of the commitment.
  await newnhamAfternoon(page).click();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(newnhamAfternoon(page)).toHaveAccessibleName(/Needs\ volunteers/);

  await page.goto("/schools/1?date=2026-09-07");
  await expect(newnhamAfternoon(page)).toHaveAccessibleName(/Needs\ more\ volunteers/);
  await page.goto("/schools/1?date=2026-09-21");
  await expect(newnhamAfternoon(page)).toHaveAccessibleName(/Needs\ more\ volunteers/);
});

function grantchesterMorning(page: import("@playwright/test").Page) {
  return page
    .locator("button.border-l-4", { hasText: "Grantchester Street crossing" })
    .filter({ hasText: "08:20" })
    .first();
}

test("cancelling a signup that looks like an ongoing regular commitment offers a one-off vs. this-and-future choice", async ({
  page,
}) => {
  await signInAs(page, "volunteer@example.com");

  // A different slot to the earlier tests in this file, so their state
  // (e.g. the "regular" claim on Newnham Road's afternoon slot) can't
  // interfere with this one.
  for (const date of ["2026-09-07", "2026-09-14", "2026-09-28"]) {
    await page.goto(`/schools/1?date=${date}`);
    await grantchesterMorning(page).click();
    await page.getByRole("button", { name: "OK" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }

  // Now cancelling any of them offers the extended choice, not a plain
  // confirmation.
  await page.goto("/schools/1?date=2026-09-14");
  await grantchesterMorning(page).click();
  await expect(page.getByText("Just this date")).toBeVisible();
  await expect(page.getByText("This and all future dates")).toBeVisible();

  // "Just this date" only cancels the one clicked.
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(grantchesterMorning(page)).toHaveAccessibleName(/Needs\ volunteers/);

  await page.goto("/schools/1?date=2026-09-28");
  await expect(grantchesterMorning(page)).toHaveAccessibleName(/Needs\ more\ volunteers/);

  // "This and all future dates" cancels the clicked one plus every later
  // one, leaving earlier dates untouched.
  await grantchesterMorning(page).click();
  await page.getByLabel("This and all future dates").check();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(grantchesterMorning(page)).toHaveAccessibleName(/Needs\ volunteers/);

  await page.goto("/schools/1?date=2026-09-07");
  await expect(grantchesterMorning(page)).toHaveAccessibleName(/Needs\ more\ volunteers/);
});

test("deleting a slot with any signup history - confirmed or cancelled - is refused rather than silently discarding it", async ({
  page,
}) => {
  await signInAs(page, "admin@example.com");
  // admin@ now administers two schools (Newnham Croft + Meadowside, seed.sql)
  // - ?school=1 pins the default to Newnham Croft rather than whichever
  // sorts first alphabetically.
  // "My calendar" is now the admin dashboard's default tab - tab=schools
  // pins it to "Your schools" so the nested Locations tab is in the DOM.
  await page.goto("/dashboard?school=1&tab=schools");
  await page.getByRole("tab", { name: "Locations" }).click();

  // Both locations have a "Morning drop-off"/"Afternoon pickup" row, so
  // scope to Newnham Road's specific card, not just the label text.
  const newnhamCard = page.locator("div.rounded-xl", { hasText: "Newnham Road crossing point" });

  // Morning drop-off has a real confirmed signup (Vera, 2026-09-07 08:15 in
  // seed.sql) - deleting it must be refused, not silently succeed.
  const morningRow = newnhamCard.locator("li", { hasText: "Morning drop-off" });
  await morningRow.getByRole("button", { name: "Delete" }).click();
  await expect(
    page.getByText(
      "Can't delete this slot: a volunteer has signed up (even if since cancelled) for one of its dates.",
      { exact: true }
    )
  ).toBeVisible();

  // Afternoon pickup's Monday instance has signup history (confirmed then
  // cancelled, from the previous tests) - even cancelled history still
  // blocks the delete, since that signup row is never hard-deleted.
  // "My calendar" is now the admin dashboard's default tab - tab=schools
  // pins it to "Your schools" so the nested Locations tab is in the DOM.
  await page.goto("/dashboard?school=1&tab=schools");
  await page.getByRole("tab", { name: "Locations" }).click();
  const afternoonRow = page
    .locator("div.rounded-xl", { hasText: "Newnham Road crossing point" })
    .locator("li", { hasText: "Afternoon pickup" });
  await afternoonRow.getByRole("button", { name: "Delete" }).click();
  await expect(
    page.getByText(
      "Can't delete this slot: a volunteer has signed up (even if since cancelled) for one of its dates.",
      { exact: true }
    )
  ).toBeVisible();
});

test("deleting a slot with no signup history at all succeeds cleanly", async ({ page }) => {
  await signInAs(page, "admin@example.com");
  // "My calendar" is now the admin dashboard's default tab - tab=schools
  // pins it to "Your schools" so the nested Locations tab is in the DOM.
  await page.goto("/dashboard?tab=schools");
  await page.getByRole("tab", { name: "Locations" }).click();

  await page.getByLabel("Name", { exact: true }).fill("Untouched Test Location");
  await page.getByRole("button", { name: "Add location" }).click();

  const newLocationCard = page.locator("div.rounded-xl", { hasText: "Untouched Test Location" });
  await newLocationCard.getByLabel("Label").fill("Test slot");
  await newLocationCard.getByLabel("Starts").fill("09:00");
  await newLocationCard.getByLabel("Ends").fill("09:30");
  await newLocationCard.getByRole("button", { name: "Add slot" }).click();

  await expect(newLocationCard.getByText("Test slot")).toBeVisible();
  await newLocationCard
    .locator("li", { hasText: "Test slot" })
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(newLocationCard.getByText("Test slot")).toHaveCount(0);

  await newLocationCard.getByRole("button", { name: "Delete location" }).click();
  await expect(page.getByText("Untouched Test Location")).toHaveCount(0);
});
