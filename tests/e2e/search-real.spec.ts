import { expect, test } from "@playwright/test";

/**
 * Real-database search specs.
 *
 * The mirror is seeded by `global-setup` with 40 deterministic offers, so these
 * assert the SQL path end to end (search, pagination, filters) instead of a
 * mocked payload. They are skipped unless E2E_REAL_DB=1.
 */
test.skip(process.env.E2E_REAL_DB !== "1", "requires the real database");

test.describe("search against the local mirror", () => {
  test("searches, then paginates on the server", async ({ page }) => {
    await page.goto("/?kw=E2E&bm=OR&goal=job");

    await expect(page.getByRole("heading", { name: "Résultats de recherche" })).toBeVisible();
    await expect(page.getByText("E2E Offre 01").first()).toBeVisible();
    await expect(page.getByText(/1-15 sur 40 offres/)).toBeVisible();

    await page.getByRole("button", { name: "2", exact: true }).click();

    // Page 2 starts at the 16th row; the first page must be gone.
    await expect(page.getByText("E2E Offre 16").first()).toBeVisible();
    await expect(page.getByText(/16-30 sur 40 offres/)).toBeVisible();
  });

  test("filters by work regime from the mirror facets", async ({ page }) => {
    await page.goto("/?kw=E2E&bm=OR&goal=job");
    await expect(page.getByText("E2E Offre 01").first()).toBeVisible();

    await page.getByRole("button", { name: /filtres/i }).click();
    await page.getByLabel("Temps plein").check();
    await page.getByRole("button", { name: /réinitialiser/i }).focus();
    await page.keyboard.press("Escape");

    // Only the odd (full-time) offers remain.
    await expect(page.getByText("E2E Offre 01").first()).toBeVisible();
    await expect(page.getByText(/sur 20 offres/)).toBeVisible();
    await expect(page.getByText("E2E Offre 02")).toHaveCount(0);
  });

  test("keeps the filters and page in the URL of a copied search", async ({ page }) => {
    await page.goto("/?kw=E2E&bm=OR&goal=job");
    await expect(page.getByText("E2E Offre 01").first()).toBeVisible();

    await page.getByRole("button", { name: "2", exact: true }).click();
    await expect(page).toHaveURL(/page=2/);
  });
});
