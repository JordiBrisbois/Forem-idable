import { expect, test, type Page, type Route } from "@playwright/test";

test("shows the search workspace and a collapsed recent history for authenticated users", async ({
  page,
}) => {
  await mockSearchWorkspace(page);

  await page.goto("/");

  await page.getByRole("button", { name: "Consulter les offres" }).click();

  await expect(page).toHaveURL(/kw=maintenance/);
  await expect(page.getByRole("heading", { name: "Résultats de recherche" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Reprenez la recherche ou affinez-la." })).toBeVisible();
  await expect(page.locator("tbody").getByText("Technicien de maintenance")).toBeVisible();
  await expect(page.locator("tbody").getByText("Electromécanicien")).toBeVisible();
  await page.getByRole("button", { name: "Historique (6)" }).click();

  await expect(page.getByRole("heading", { name: "Historique récent" })).toBeVisible();
  await expect(page.getByRole("button", { name: /history-one/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /history-two/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /history-three/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /history-four/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /history-five/i })).not.toBeVisible();
  await expect(page.getByRole("button", { name: /history-six/i })).not.toBeVisible();

  await page.getByRole("button", { name: "Voir 2 de plus" }).click();

  await expect(page.getByRole("button", { name: /history-five/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /history-six/i })).toBeVisible();
});

test("shares an offer in direct message from the search table", async ({ page }) => {
  let sharedPayload: { targetUserId: number; content: string } | null = null;

  await mockSearchWorkspace(page);

  await page.route("**/api/messages/conversations", async (route: Route) => {
    await route.fulfill({ json: { conversations: [] } });
  });

  await page.route("**/api/messages/contacts", async (route: Route) => {
    await route.fulfill({
      json: {
        contacts: [
          {
            userId: 77,
            firstName: "Jean",
            lastName: "Dupont",
            email: "jean.dupont@example.test",
            role: "user",
            sharedGroupCount: 1,
            relationLabel: "1 groupe commun",
          },
        ],
      },
    });
  });

  await page.route("**/api/messages/share/direct", async (route: Route) => {
    sharedPayload = (await route.request().postDataJSON()) as {
      targetUserId: number;
      content: string;
    };

    await route.fulfill({
      json: {
        conversationId: 501,
        message: {
          id: 9001,
          conversationId: 501,
          type: "job_share",
          content: "https://example.test/offres/maintenance-1",
          metadata: {},
          createdAt: "2026-03-24T11:00:00.000Z",
          editedAt: null,
          deletedAt: null,
          author: null,
          isOwnMessage: true,
        },
      },
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Consulter les offres" }).click();

  const firstRow = page.locator("tbody tr").filter({ hasText: "Technicien de maintenance" });
  await firstRow.getByLabel("Partager dans les messages").click();

  await expect(page.getByRole("dialog", { name: "Partager une offre" })).toBeVisible();
  await page.getByRole("option", { name: /Jean Dupont/i }).click();

  await expect.poll(() => sharedPayload).not.toBeNull();
  expect(sharedPayload).toEqual({
    targetUserId: 77,
    content: "https://example.test/offres/maintenance-1",
  });
  await expect(page.getByText("Offre envoyée en message privé.")).toBeVisible();
});

async function mockSearchWorkspace(page: Page) {
  await page.route("**/api/auth/me", async (route: Route) => {
    await route.fulfill({
      json: {
        user: {
          id: 42,
          email: "demo@example.test",
          firstName: "Demo",
          lastName: "User",
          role: "user",
        },
      },
    });
  });

  await page.route("**/api/applications", async (route: Route) => {
    await route.fulfill({ json: { applications: [] } });
  });

  await page.route("**/api/search-history", async (route: Route) => {
    await route.fulfill({
      json: {
        history: [
          makeHistoryEntry("history-one", "2026-03-24T08:00:00.000Z"),
          makeHistoryEntry("history-two", "2026-03-24T07:00:00.000Z"),
          makeHistoryEntry("history-three", "2026-03-24T06:00:00.000Z"),
          makeHistoryEntry("history-four", "2026-03-24T05:00:00.000Z"),
          makeHistoryEntry("history-five", "2026-03-24T04:00:00.000Z"),
          makeHistoryEntry("history-six", "2026-03-24T03:00:00.000Z"),
        ],
      },
    });
  });

  await page.route("**/api/featured-searches", async (route: Route) => {
    await route.fulfill({
      json: {
        featuredSearches: [
          {
            id: 1,
            title: "Sélection maintenance",
            message: "Une recherche guidée pour vérifier la vue workspace.",
            ctaLabel: "Consulter les offres",
            query: {
              keywords: ["maintenance"],
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

  await page.route("https://www.odwb.be/api/explore/v2.1/**", async (route: Route) => {
    await route.fulfill({
      json: {
        total_count: 2,
        results: [
          {
            numerooffreforem: "forem-maintenance-1",
            titreoffre: "Technicien de maintenance",
            nomemployeur: "Atelier central",
            lieuxtravaillocalite: ["Liège"],
            typecontrat: "CDI",
            datedebutdiffusion: "2026-03-24T08:00:00.000Z",
            url: "https://example.test/offres/maintenance-1",
            metier: "Technicien",
          },
          {
            numerooffreforem: "forem-maintenance-2",
            titreoffre: "Electromécanicien",
            nomemployeur: "Usine pilote",
            lieuxtravaillocalite: ["Seraing"],
            typecontrat: "CDD",
            datedebutdiffusion: "2026-03-23T08:00:00.000Z",
            url: "https://example.test/offres/maintenance-2",
            metier: "Electromécanicien",
          },
        ],
      },
    });
  });

  await page.route("**/api/providers/adzuna/search", async (route: Route) => {
    await route.fulfill({
      json: {
        jobs: [],
        total: 0,
        enabled: true,
      },
    });
  });
}

function makeHistoryEntry(keyword: string, createdAt: string) {
  return {
    id: `${keyword}-id`,
    state: {
      keywords: [keyword],
      locations: [],
      booleanMode: "OR" as const,
    },
    createdAt,
  };
}
