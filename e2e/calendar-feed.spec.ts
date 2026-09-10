import { test, expect } from "@playwright/test";
import { signInAs } from "./helpers/auth";

// The webcal/.ics subscribe feed on "My calendar" (src/app/calendar/
// [token]/feed.ics) - covers the token lifecycle (issue, rate-limit,
// regenerate/invalidate) end to end, not just the ICS formatting itself.
test.describe.configure({ mode: "serial" });

test("subscribe link works, is rate-limited, and regenerating invalidates the old one", async ({
  page,
  request,
}) => {
  await signInAs(page, "oliver.bennett@example.com");
  await page.goto("/dashboard");

  const urlCode = page.locator("code");
  await expect(urlCode).toBeVisible();
  const feedUrl = (await urlCode.textContent())?.trim();
  expect(feedUrl).toMatch(/^https?:\/\/.+\/calendar\/.+\/feed\.ics$/);

  const res1 = await request.get(feedUrl!);
  expect(res1.status()).toBe(200);
  expect(res1.headers()["content-type"]).toContain("text/calendar");
  const body1 = await res1.text();
  expect(body1).toContain("BEGIN:VCALENDAR");
  expect(body1).toContain("BEGIN:VTIMEZONE");
  expect(body1).toContain("TZID:Europe/London");
  expect(body1).toContain("BEGIN:VEVENT");
  // Oliver's own seeded confirmed signup (seed.sql) - the feed is scoped
  // to just the signed-in volunteer's own confirmed slots.
  expect(body1).toContain("Burnage Lane");
  expect(body1).toContain("END:VCALENDAR");

  // A second fetch inside the 60s cooldown is refused rather than hitting
  // the database again.
  const res2 = await request.get(feedUrl!);
  expect(res2.status()).toBe(429);

  // Regenerating swaps the token and resets the cooldown - the old link
  // dies immediately, the new one works right away rather than inheriting
  // however recently the dead token was fetched.
  await page.getByRole("button", { name: "Regenerate link" }).click();
  await expect(urlCode).not.toHaveText(feedUrl!, { timeout: 10000 });
  const newFeedUrl = (await urlCode.textContent())?.trim();
  expect(newFeedUrl).not.toBe(feedUrl);

  const resOld = await request.get(feedUrl!);
  expect(resOld.status()).toBe(404);

  const resNew = await request.get(newFeedUrl!);
  expect(resNew.status()).toBe(200);
});

test("an unknown token 404s", async ({ request }) => {
  const res = await request.get("/calendar/00000000-0000-0000-0000-000000000000/feed.ics");
  expect(res.status()).toBe(404);
});
