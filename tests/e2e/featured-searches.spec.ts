import { expect, test } from "@playwright/test";

test("runs a featured search from the homepage", async ({ page }) => {
  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({ json: { user: null } });
  });

  await page.route("**/api/applications", async (route) => {
    await route.fulfill({ json: { applications: [] } });
  });

  await page.route("**/api/featured-searches", async (route) => {
    await route.fulfill({
      json: {
        featuredSearches: [
          {
            id: 1,
            title: "Salon de l'emploi à SPA",
            message: "Le salon aura lieu le 1er avril. Consultez les offres publiées pour l'événement.",
            ctaLabel: "Consulter les offres",
            query: {
              keywords: ["SALONSPA"],
              locations: [],
              booleanMode: "OR",
            },
            isActive: true,
            sortOrder: 0,
            createdAt: "2026-03-24T10:00:00.000Z",
            updatedAt: "2026-03-24T10:00:00.000Z",
          },
        ],
      },
    });
  });

  await page.route("https://www.odwb.be/api/explore/v2.1/**", async (route) => {
    await route.fulfill({
      json: {
        total_count: 1,
        results: [
          {
            numerooffreforem: "forem-salonspa-1",
            titreoffre: "Conseiller emploi - Salon SPA",
            nomemployeur: "Ville de Spa",
            lieuxtravaillocalite: ["Spa"],
            typecontrat: "CDD",
            datedebutdiffusion: "2026-03-31T08:00:00.000Z",
            url: "https://example.test/offres/salon-spa",
            metier: "Conseiller",
          },
        ],
      },
    });
  });

  await page.route("**/api/providers/adzuna/search", async (route) => {
    await route.fulfill({
      json: {
        jobs: [],
        total: 0,
        enabled: true,
      },
    });
  });

  await page.goto("/");

  await expect(page.getByText("Salon de l'emploi à SPA")).toBeVisible();

  await page.getByRole("button", { name: "Consulter les offres" }).click();

  await expect(page).toHaveURL(/kw=SALONSPA/);
  await expect(page.getByText("Résultats de recherche")).toBeVisible();
  await expect(page.getByText("Conseiller emploi - Salon SPA").last()).toBeVisible();
});
