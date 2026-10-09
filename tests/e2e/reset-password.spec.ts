import { expect, test } from "@playwright/test";

test("reset-password page is reachable while logged out and shows the form", async ({ page }) => {
  const response = await page.goto("/reset-password?token=test-token");

  // Must not be redirected to the home page by the middleware.
  await expect(page).toHaveURL(/\/reset-password/);
  expect(response?.status()).toBeLessThan(400);

  await expect(page.getByRole("heading", { level: 1 })).toContainText(/mot de passe/i);
});
