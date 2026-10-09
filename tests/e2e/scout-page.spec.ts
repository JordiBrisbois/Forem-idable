import { expect, test, type Page, type Route } from "@playwright/test";
import { emptyStorageState } from "./support/session";

const coachUser = {
  id: 1,
  email: "coach@example.test",
  firstName: "Co",
  lastName: "Ach",
  role: "coach",
};

function mockMe(page: Page, user: unknown) {
  return page.route("**/api/auth/me", (route: Route) => route.fulfill({ json: { user } }));
}

test.describe("Scout Page", () => {
  test.describe("Authentication", () => {
    test.use({ storageState: emptyStorageState() });

    test("redirects to the home page when not authenticated", async ({ page }) => {
      await page.goto("/scout");
      // The middleware redirects protected pages to the home page.
      await expect(page).toHaveURL(/\/$/);
    });
  });

  test.describe("Signed out state", () => {
    test("shows the sign-in required card", async ({ page }) => {
      await mockMe(page, null);
      await page.goto("/scout");
      await expect(page.getByRole("heading", { name: "Connexion requise" })).toBeVisible();
      await expect(page.getByText("Connectez-vous pour utiliser le Scout.")).toBeVisible();
    });
  });

  test.describe("Signed in layout", () => {
    test.beforeEach(async ({ page }) => {
      await mockMe(page, coachUser);
      await page.route("**/api/scout/**", (route: Route) => route.fulfill({ json: { jobs: [] } }));
    });

    test("displays the main header and search form", async ({ page }) => {
      await page.goto("/scout");
      await expect(page.getByRole("heading", { level: 1, name: "Scout" })).toBeVisible();
      await expect(page.getByText("Nouvelle recherche")).toBeVisible();
      await expect(page.getByLabel("Ville")).toBeVisible();
      await expect(page.getByRole("button", { name: "Lancer la recherche" })).toBeVisible();
    });

    test.describe("Mobile", () => {
      test.use({ viewport: { width: 375, height: 667 } });

      test("form is usable on mobile", async ({ page }) => {
        await page.goto("/scout");
        await expect(page.getByRole("heading", { level: 1, name: "Scout" })).toBeVisible();
        await expect(page.getByLabel("Ville")).toBeVisible();
        await expect(page.getByRole("button", { name: "Lancer la recherche" })).toBeVisible();
      });
    });
  });
});
