import { expect, test } from "@playwright/test";

test("reset-password page is reachable while logged out", async ({ page }) => {
  const response = await page.goto("/reset-password?token=test-token");

  // Must not be redirected to the home page by the middleware.
  await expect(page).toHaveURL(/\/reset-password/);
  expect(response?.status()).toBeLessThan(400);

  // Either the reset form (feature enabled) or the "unavailable" notice
  // (feature disabled) — never a blank/redirected page.
  await expect(
    page.getByRole("heading", { name: /mot de passe|indisponible/i }).first()
  ).toBeVisible();
});
