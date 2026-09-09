import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { signInAs } from "./helpers/auth";

// Fixed local-stack default service-role key (printed by `supabase
// start`), used to verify state with no UI path — never valid against a
// hosted project. Same pattern as volunteer-list.spec.ts.
const serviceClient = createClient(
  "http://127.0.0.1:54321",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
);

test.describe.configure({ mode: "serial" });

test("superuser can add a whole academic year of default terms in one submission", async ({
  page,
}) => {
  await signInAs(page, "superuser@example.com");
  await page.goto("/dashboard");
  await page.getByRole("tab", { name: "Terms" }).click();

  // no per-term/per-season add form — just "Add a year"
  await expect(page.getByText("Add a year")).toBeVisible();
  await expect(page.getByLabel("Season", { exact: true })).toHaveCount(0);

  // seeded 2026/2027 year is already there
  await expect(page.getByText("2026/2027")).toBeVisible();
  await expect(page.getByText("Autumn 2026")).toBeVisible();

  await page.locator('input[name="autumn_start_date"]').fill("2027-09-06");
  await page.locator('input[name="autumn_half_term_start"]').fill("2027-10-25");
  await page.locator('input[name="autumn_half_term_end"]').fill("2027-10-29");
  await page.locator('input[name="autumn_end_date"]').fill("2027-12-17");

  await page.locator('input[name="spring_start_date"]').fill("2028-01-04");
  await page.locator('input[name="spring_half_term_start"]').fill("2028-02-15");
  await page.locator('input[name="spring_half_term_end"]').fill("2028-02-19");
  await page.locator('input[name="spring_end_date"]').fill("2028-03-24");

  await page.locator('input[name="summer_start_date"]').fill("2028-04-11");
  await page.locator('input[name="summer_half_term_start"]').fill("2028-05-23");
  await page.locator('input[name="summer_half_term_end"]').fill("2028-05-27");
  await page.locator('input[name="summer_end_date"]').fill("2028-07-18");

  await page.getByRole("button", { name: "Add year" }).click();

  await expect(page.getByText("2027/2028")).toBeVisible();
  await expect(page.getByText("Autumn 2027")).toBeVisible();
  await expect(page.getByText("Spring 2028")).toBeVisible();
  await expect(page.getByText("Summer 2028")).toBeVisible();

  // clean up the added year (each term deletes independently)
  for (const name of ["Autumn 2027", "Spring 2028", "Summer 2028"]) {
    await page
      .locator("li", { hasText: name })
      .getByRole("button", { name: "Delete" })
      .click();
    await expect(page.getByText(name)).not.toBeVisible();
  }

  // Deleting default_terms rows doesn't cascade-delete the terms rows
  // they already propagated to existing schools (by design — see the
  // "already-created school terms shouldn't be affected" discussion) —
  // clean those up directly so later tests only see the seeded 2026/2027
  // year for Newnham Croft, not a leftover 2027/2028 too.
  await serviceClient
    .from("terms")
    .delete()
    .in("name", [
      "Autumn 1 2027",
      "Autumn 2 2027",
      "Spring 1 2028",
      "Spring 2 2028",
      "Summer 1 2028",
      "Summer 2 2028",
    ]);
});

test("a school's terms are auto-populated from default_terms and editable in place, with no add form", async ({
  page,
}) => {
  await signInAs(page, "admin@example.com");
  await page.goto("/dashboard");
  await page.getByRole("link", { name: "Newnham Croft Primary" }).click();
  await page.getByRole("tab", { name: "Term times" }).click();

  // populated automatically (on_default_term_created), not by a form
  await expect(page.getByRole("heading", { name: "2026/2027", exact: true })).toBeVisible();
  await expect(page.getByText("Autumn 2026")).toBeVisible();
  await expect(page.getByText("Spring 2027")).toBeVisible();
  await expect(page.getByText("Summer 2027")).toBeVisible();
  await expect(page.getByText("Add a term")).toHaveCount(0);
  await expect(page.getByText("Add a year")).toHaveCount(0);

  // edit a term's dates in place
  // <details> resets closed on every server-action revalidation, so open
  // it directly via evaluate() rather than clicking "Edit dates" — a click
  // can race the re-render and land on an about-to-be-replaced element.
  async function openEditDetails(rowText: string) {
    const row = page.locator("li", { hasText: rowText });
    await row.locator("details", { has: page.getByText("Edit dates") }).evaluate((el) => {
      (el as HTMLDetailsElement).open = true;
    });
    return row;
  }

  let autumnRow = await openEditDetails("Autumn 2026");
  await autumnRow.locator('input[name="end_date"]').fill("2026-12-19");
  await autumnRow.getByRole("button", { name: "Save" }).click();

  await expect(
    page.getByText("2026-09-01 – 2026-10-27, half term, 2026-10-31 – 2026-12-19")
  ).toBeVisible();

  // restore for other tests / repeat runs
  autumnRow = await openEditDetails("Autumn 2026");
  await autumnRow.locator('input[name="end_date"]').fill("2026-12-22");
  await autumnRow.getByRole("button", { name: "Save" }).click();
  await expect(
    page.getByText("2026-09-01 – 2026-10-27, half term, 2026-10-31 – 2026-12-22")
  ).toBeVisible();
});

// A brand-new school has no admin yet (creating one doesn't auto-grant
// admin rights — see TODO.md §4), and the superuser dashboard has no
// per-school "Term times" tab (that's admin-dashboard-only), so there's no
// UI path to check this for an unclaimed school. Verifying directly
// against the database instead, same pattern as volunteer-list.spec.ts.
test("a new school is automatically backfilled with terms from existing default years", async ({
  page,
}) => {
  await signInAs(page, "superuser@example.com");

  await page.goto("/schools/new");
  const schoolName = `Backfill Test ${Date.now()}`;
  await page.getByLabel("School name").fill(schoolName);
  await page.getByLabel("Street").fill("1 Test Street");
  await page.getByLabel("Town/City").fill("Cambridge");
  await page.getByRole("button", { name: "Create school" }).click();
  await expect(page.getByRole("heading", { name: schoolName })).toBeVisible();

  const { data: school } = await serviceClient
    .from("schools")
    .select("id")
    .eq("name", schoolName)
    .single();
  const { data: terms } = await serviceClient
    .from("terms")
    .select("name")
    .eq("school_id", school!.id);

  const names = (terms ?? []).map((t) => t.name).sort();
  expect(names).toEqual([
    "Autumn 1 2026",
    "Autumn 2 2026",
    "Spring 1 2027",
    "Spring 2 2027",
    "Summer 1 2027",
    "Summer 2 2027",
  ]);
});

test("bank holidays outside term time are filtered out of the collapsible", async ({ page }) => {
  await signInAs(page, "admin@example.com");
  await page.goto("/dashboard");
  await page.getByRole("link", { name: "Newnham Croft Primary" }).click();
  await page.getByRole("tab", { name: "Term times" }).click();

  // Christmas Day / Boxing Day / New Year's Day fall in the Christmas
  // holiday, outside any term's teaching days — filtered out. Good Friday
  // falls inside Spring's teaching days (before its half term) — shown.
  const details2026 = page.locator("details", { has: page.getByText(/Inset days/) }).first();
  await details2026.evaluate((el) => {
    (el as HTMLDetailsElement).open = true;
  });
  await expect(page.getByText("Christmas Day")).not.toBeVisible();
  await expect(page.getByText("Boxing Day")).not.toBeVisible();
  await expect(page.getByText("New Year's Day")).not.toBeVisible();
  await expect(page.getByText("Good Friday")).toBeVisible();
});

test("inset days table is compact with numbered rows, scoped per academic year, and rows can be added client-side", async ({
  page,
}) => {
  await signInAs(page, "admin@example.com");
  await page.goto("/dashboard");
  await page.getByRole("link", { name: "Newnham Croft Primary" }).click();
  await page.getByRole("tab", { name: "Term times" }).click();

  // each academic year gets its own "Add inset days" section, not one
  // shared form — scope everything to the 2026/2027 one specifically
  await expect(page.getByText("Add inset days for 2026/2027")).toBeVisible();
  const section2026 = page
    .locator("div", { has: page.getByText("Add inset days for 2026/2027") })
    .last();

  await expect(section2026.getByRole("columnheader", { name: "#" })).toBeVisible();
  await expect(section2026.getByRole("columnheader", { name: "Date" })).toBeVisible();
  await expect(section2026.getByRole("columnheader", { name: "Notes" })).toBeVisible();
  await expect(section2026.locator("tbody tr")).toHaveCount(5);

  // "Add row" is client-side — no page reload, no server round trip
  await section2026.getByRole("button", { name: "Add row" }).click();
  await expect(section2026.locator("tbody tr")).toHaveCount(6);

  // fill the manually-added 6th row and submit
  await section2026.getByLabel("Inset day 6 date").fill("2026-09-04");
  await section2026.getByLabel("Inset day 6 notes").fill("Manually added row");
  await section2026.getByRole("button", { name: "Add inset days" }).click();
  // the form submission is a real server round trip (unlike "Add row"),
  // so give it a moment to complete before checking/cleaning up
  await page.waitForLoadState("networkidle");

  await page
    .locator("details", { has: page.getByText("Manually added row") })
    .evaluate((el) => {
      (el as HTMLDetailsElement).open = true;
    });
  await expect(page.getByText("Manually added row")).toBeVisible();

  await page
    .locator("li", { hasText: "Manually added row" })
    .getByRole("button", { name: "Delete" })
    .click();
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("Manually added row")).not.toBeVisible();
});
