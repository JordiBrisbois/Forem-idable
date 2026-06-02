import { expect, test } from "@playwright/test";

type DeletionRequestFixture = {
  id: number;
  status: string;
  reason: string;
  requestedAt: string;
  reviewedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  reviewNote: string | null;
  user: { id: number; email: string; firstName: string; lastName: string; role: string };
};

test("admin can approve and complete an account deletion request", async ({ page }) => {
  let deletionRequests: DeletionRequestFixture[] = [
    {
      id: 1,
      status: "pending" as const,
      reason: "Je souhaite fermer mon compte.",
      requestedAt: "2026-03-25T16:10:00.000Z",
      reviewedAt: null,
      completedAt: null,
      cancelledAt: null,
      reviewNote: null,
      user: {
        id: 41,
        email: "user@example.test",
        firstName: "Jordi",
        lastName: "Brisbois",
        role: "user",
      },
    },
  ];

  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      json: {
        user: {
          id: 1,
          email: "admin@example.test",
          firstName: "Ada",
          lastName: "Admin",
          role: "admin",
        },
      },
    });
  });

  await page.route("**/api/coach/dashboard", async (route) => {
    await route.fulfill({
      json: {
        dashboard: {
          viewer: {
            id: 1,
            email: "admin@example.test",
            firstName: "Ada",
            lastName: "Admin",
            role: "admin",
          },
          users: [],
          groups: [],
          availableCoaches: [],
        },
      },
    });
  });

  await page.route("**/api/admin/api-keys", async (route) => {
    await route.fulfill({ json: { apiKeys: [] } });
  });

  await page.route("**/api/admin/featured-searches", async (route) => {
    await route.fulfill({ json: { featuredSearches: [] } });
  });

  await page.route("**/api/admin/account-deletion-requests", async (route) => {
    await route.fulfill({ json: { requests: deletionRequests } });
  });

  await page.route("**/api/admin/account-deletion-requests/1", async (route) => {
    const body = (await route.request().postDataJSON()) as {
      action: "approve" | "reject" | "complete";
      reviewNote?: string;
    };

    if (body.action === "approve") {
      deletionRequests = [
        {
          ...deletionRequests[0],
          status: "approved",
          reviewedAt: "2026-03-25T16:20:00.000Z",
          reviewNote: body.reviewNote ?? null,
        },
      ];

      await route.fulfill({
        json: {
          request: deletionRequests[0],
          deletedUserId: null,
        },
      });
      return;
    }

    deletionRequests = [];
    await route.fulfill({
      json: {
        request: null,
        deletedUserId: 41,
      },
    });
  });

  await page.goto("/admin");

  await expect(page.getByRole("main").getByText("Administration", { exact: true })).toBeVisible();
  await expect(page.getByRole("main").getByText("Demandes de suppression", { exact: true })).toBeVisible();
  await expect(page.getByRole("main").getByText("Jordi Brisbois", { exact: true })).toBeVisible();

  await page.getByLabel("Note de revue").fill("Demande validée après vérification.");
  await page.getByRole("button", { name: "Approuver" }).click();

  await expect(page.getByRole("main").getByText("Approuvée", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Finaliser" }).click();

  await expect(
    page.getByRole("alertdialog", { name: "Finaliser la suppression du compte" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Supprimer définitivement" }).click();

  await expect(page.getByText("Aucune demande de suppression pour l'instant.")).toBeVisible();
});

test("admin can reject an account deletion request without breaking the page", async ({ page }) => {
  let deletionRequests: DeletionRequestFixture[] = [
    {
      id: 1,
      status: "pending" as const,
      reason: "Je souhaite fermer mon compte.",
      requestedAt: "2026-03-25T16:10:00.000Z",
      reviewedAt: null,
      completedAt: null,
      cancelledAt: null,
      reviewNote: null,
      user: {
        id: 41,
        email: "user@example.test",
        firstName: "Jordi",
        lastName: "Brisbois",
        role: "user",
      },
    },
  ];

  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      json: {
        user: {
          id: 1,
          email: "admin@example.test",
          firstName: "Ada",
          lastName: "Admin",
          role: "admin",
        },
      },
    });
  });

  await page.route("**/api/coach/dashboard", async (route) => {
    await route.fulfill({
      json: {
        dashboard: {
          viewer: {
            id: 1,
            email: "admin@example.test",
            firstName: "Ada",
            lastName: "Admin",
            role: "admin",
          },
          users: [],
          groups: [],
          availableCoaches: [],
        },
      },
    });
  });

  await page.route("**/api/admin/api-keys", async (route) => {
    await route.fulfill({ json: { apiKeys: [] } });
  });

  await page.route("**/api/admin/featured-searches", async (route) => {
    await route.fulfill({ json: { featuredSearches: [] } });
  });

  await page.route("**/api/admin/account-deletion-requests", async (route) => {
    await route.fulfill({ json: { requests: deletionRequests } });
  });

  await page.route("**/api/admin/account-deletion-requests/1", async (route) => {
    const body = (await route.request().postDataJSON()) as {
      action: "approve" | "reject" | "complete";
      reviewNote?: string;
    };

    deletionRequests = [
      {
        ...deletionRequests[0],
        status: "rejected",
        reviewedAt: "2026-03-25T16:20:00.000Z",
        reviewNote: body.reviewNote ?? null,
      },
    ];

    await route.fulfill({
      json: {
        request: deletionRequests[0],
        deletedUserId: null,
      },
    });
  });

  await page.goto("/admin");

  await expect(page.getByRole("main").getByText("Demandes de suppression", { exact: true })).toBeVisible();
  await page.getByLabel("Note de revue").fill("Compte conservé après vérification.");
  await page.getByRole("button", { name: "Refuser" }).click();

  await expect(page.getByText("Demande refusée.")).toBeVisible();
  await expect(page.getByText("Incident d'affichage")).not.toBeVisible();

  await page.getByRole("radio", { name: /Refusées/ }).click();
  await expect(page.getByRole("main").getByText("Refusée", { exact: true })).toBeVisible();
  await expect(page.getByText("Note revue: Compte conservé après vérification.")).toBeVisible();
  await expect(page.getByRole("main").getByText("Jordi Brisbois", { exact: true })).toBeVisible();
});
