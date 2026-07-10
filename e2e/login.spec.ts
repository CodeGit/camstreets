import { test, expect } from "@playwright/test";
import { getMagicLinkFor } from "./helpers/mailpit";

test("magic link sign-in and sign-out", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send magic link" }).click();

  await expect(
    page.getByText("Check your email for a sign-in link.")
  ).toBeVisible();

  const magicLink = await getMagicLinkFor(email);
  await page.goto(magicLink);

  await expect(page).toHaveURL("/");
  await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();

  await expect(page).toHaveURL("/login");
  await expect(
    page.getByRole("button", { name: "Send magic link" })
  ).toBeVisible();
});
