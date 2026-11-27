import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const offerId = "2164057";

const job = {
  id: offerId,
  title: "Peintre carrossier (H/F/X)",
  company: "KONVERT",
  location: "Namur",
  contractType: "CDI",
  publicationDate: "2026-11-26T09:00:00.000Z",
  url: `https://www.leforem.be/recherche-offres/offre-detail/${offerId}`,
  description: "Peinture industrielle",
  source: "forem",
};

const details = {
  source: "forem-detail-api",
  description: "Description complète de l'offre.",
  highlights: [{ label: "Employeur", value: "KONVERT" }],
  sections: [{ title: "Comment postuler", content: "Envoyez votre CV." }],
  job,
};

async function mockSearch(page: Page) {
  await page.route("**/api/offers/facets", (route) =>
    route.fulfill({ json: { regimes: [], sectors: [], languages: [] } })
  );
  await page.route("**/api/offers/status*", (route) =>
    route.fulfill({
      json: {
        offers: 1,
        lastSyncAt: null,
        lastSyncStatus: "success",
        ageMinutes: 5,
        stale: false,
        newOffers: null,
      },
    })
  );
  await page.route("**/api/offers/search", (route) =>
    route.fulfill({ json: { jobs: [job], total: 1 } })
  );
  await page.route(`**/api/offers/${offerId}`, (route) => route.fulfill({ json: details }));
}

test.describe("offer panel", () => {
  test("opens above the list, puts the offer in the URL and survives a reload", async ({
    page,
  }) => {
    await mockSearch(page);
    await page.goto("/?kw=E2E&bm=OR&goal=job");

    await page.locator("tbody").getByText(job.title).first().click();

    await expect(page.getByRole("dialog", { name: job.title })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`offre=${offerId}`));
    await expect(page.getByText("Description complète de l'offre.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Comment postuler" })).toBeVisible();

    await page.reload();

    await expect(page.getByRole("dialog", { name: job.title })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`offre=${offerId}`));
  });

  test("closes with Escape and removes the offer from the URL", async ({ page }) => {
    await mockSearch(page);
    await page.goto(`/?kw=E2E&bm=OR&goal=job&offre=${offerId}`);

    const panel = page.getByRole("dialog", { name: job.title });
    await expect(panel).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(panel).toBeHidden();
    await expect(page).not.toHaveURL(/offre=/);
  });

  test("offers a link to open the offer on its own page", async ({ page }) => {
    await mockSearch(page);
    await page.goto(`/?kw=E2E&bm=OR&goal=job&offre=${offerId}`);

    const link = page.getByRole("link", { name: /ouvrir dans un onglet/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", `/offres/${offerId}`);
  });
});
