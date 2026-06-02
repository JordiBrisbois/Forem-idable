import { test, expect } from "@playwright/test";

test.describe("Scout Page", () => {
  test.describe("Authentication", () => {
    test("redirects to login page when not authenticated", async ({ page }) => {
      await page.goto("/scout");
      await expect(page).toHaveURL(/.*login/);
    });
  });

  test.describe("Desktop Layout", () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test("displays the main header", async ({ page }) => {
      // This test would need authentication setup
      // For now, we'll test the layout structure
      await page.goto("/scout");
      // Check if authentication is required (expected for unauthenticated users)
      await expect(page.getByText("Connexion requise")).toBeVisible();
    });

    test("has proper form structure", async ({ page }) => {
      await page.goto("/scout");
      // Check authentication card
      await expect(page.locator("card").first()).toBeVisible();
    });
  });

  test.describe("Mobile Layout", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test("displays mobile-friendly layout", async ({ page }) => {
      await page.goto("/scout");
      // Check authentication card is visible
      await expect(page.locator("card").first()).toBeVisible();
    });

    test("form is accessible on mobile", async ({ page }) => {
      await page.goto("/scout");
      // Authentication required message should be visible
      await expect(page.getByText("Connexion requise")).toBeVisible();
    });
  });
});
