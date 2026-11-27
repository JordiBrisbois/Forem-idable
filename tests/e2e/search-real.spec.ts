import { expect, test } from "@playwright/test";

/**
 * Real-database search specs.
 *
 * The mirror is seeded by `global-setup` with 40 deterministic offers, so these
 * assert the SQL path end to end (search, pagination, filters) instead of a
 * mocked payload. They are skipped unless E2E_REAL_DB=1.
 *
 * Seeded offers are numbered 01..40 and their publication date grows with the
 * number, so the newest first means page 1 starts at 40.
 */
test.skip(process.env.E2E_REAL_DB !== "1", "requires the real database");

test.describe("search against the local mirror", () => {
  test("searches, then paginates on the server", async ({ page }) => {
    await page.goto("/?kw=E2E&bm=OR&goal=job");

    await expect(page.getByText("40 offres trouvées")).toBeVisible();
    await expect(page.locator("tbody").getByText("E2E Offre 40").first()).toBeVisible();
    await expect(page.getByText(/1-15 sur 40 offres/)).toBeVisible();

    await page.getByRole("button", { name: "2", exact: true }).click();

    // Page 2 starts at the 16th row, i.e. offer 25 in descending order.
    await expect(page.locator("tbody").getByText("E2E Offre 25").first()).toBeVisible();
    await expect(page.getByText(/16-30 sur 40 offres/)).toBeVisible();
  });

  test("filters by work regime from the mirror facets", async ({ page }) => {
    await page.goto("/?kw=E2E&bm=OR&goal=job");
    await expect(page.locator("tbody").getByText("E2E Offre 40").first()).toBeVisible();

    await page.getByRole("button", { name: /filtres/i }).click();
    await page.getByLabel("Temps plein").check();
    await page.keyboard.press("Escape");

    // Full-time offers are the odd numbers: 20 of them, newest is 39.
    await expect(page.getByText("20 offres trouvées")).toBeVisible();
    await expect(page.locator("tbody").getByText("E2E Offre 39").first()).toBeVisible();
    await expect(page.locator("tbody").getByText("E2E Offre 40")).toHaveCount(0);
  });

  test("keeps the page in the URL so a copied search reproduces it", async ({ page }) => {
    await page.goto("/?kw=E2E&bm=OR&goal=job");
    await expect(page.locator("tbody").getByText("E2E Offre 40").first()).toBeVisible();

    await page.getByRole("button", { name: "2", exact: true }).click();
    await expect(page).toHaveURL(/page=2/);
  });
});
