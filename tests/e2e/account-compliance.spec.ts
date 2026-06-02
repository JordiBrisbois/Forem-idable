import { expect, test } from "@playwright/test";

test("manages data export and account deletion requests from the account page", async ({ page }) => {
  let exportRequests: Array<{
    id: number;
    status: "pending" | "completed" | "failed";
    format: string;
    createdAt: string;
    completedAt: string | null;
    expiresAt: string | null;
    error: string | null;
  }> = [];
  let deletionRequests: Array<{
    id: number;
    status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
    reason: string | null;
    requestedAt: string;
    reviewedAt: string | null;
    completedAt: string | null;
    cancelledAt: string | null;
    reviewNote: string | null;
  }> = [];
  let nextExportId = 1;
  let nextDeletionId = 1;

  await page.route("**/api/auth/me", async (route) => {
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

  await page.route("**/api/account/data-export", async (route) => {
    const request = route.request();

    if (request.method() === "GET") {
      await route.fulfill({ json: { requests: exportRequests } });
      return;
    }

    if (request.method() === "POST") {
      const createdAt = "2026-03-25T16:00:00.000Z";
      exportRequests = [
        {
          id: nextExportId++,
          status: "completed",
          format: "json",
          createdAt,
          completedAt: createdAt,
          expiresAt: "2026-04-01T16:00:00.000Z",
          error: null,
        },
        ...exportRequests,
      ];

      await route.fulfill({
        status: 201,
        json: {
          request: exportRequests[0],
        },
      });
      return;
    }

    await route.fallback();
  });

  await page.route("**/api/account/deletion-request", async (route) => {
    const request = route.request();

    if (request.method() === "GET") {
      await route.fulfill({ json: { requests: deletionRequests } });
      return;
    }

    if (request.method() === "POST") {
      const body = (await request.postDataJSON()) as { reason?: string };
      deletionRequests = [
        {
          id: nextDeletionId++,
          status: "pending",
          reason: body.reason ?? null,
          requestedAt: "2026-03-25T16:10:00.000Z",
          reviewedAt: null,
          completedAt: null,
          cancelledAt: null,
          reviewNote: null,
        },
        ...deletionRequests,
      ];

      await route.fulfill({
        status: 201,
        json: {
          request: deletionRequests[0],
        },
      });
      return;
    }

    if (request.method() === "DELETE") {
      const pending = deletionRequests.find((entry) => entry.status === "pending");
      if (pending) {
        pending.status = "cancelled";
        pending.cancelledAt = "2026-03-25T16:20:00.000Z";
      }

      await route.fulfill({
        json: {
          request: pending ?? null,
        },
      });
      return;
    }

    await route.fallback();
  });

  await page.goto("/account");

  await expect(page.getByRole("heading", { name: "Mon compte" })).toBeVisible();
  await expect(page.getByText("Mes données")).toBeVisible();
  await expect(page.getByText("Suppression du compte")).toBeVisible();

  await page.getByRole("button", { name: "Générer un export" }).click();

  await expect(page.getByText("Dernier export disponible")).toBeVisible();
  await expect(page.getByRole("button", { name: "Télécharger l'export" })).toBeVisible();

  await page.getByLabel("Motif facultatif").fill("Je souhaite fermer mon compte de test.");
  await page.getByLabel("Tapez SUPPRIMER pour confirmer").fill("SUPPRIMER");
  await page.getByRole("button", { name: "Demander la suppression" }).click();

  await expect(
    page.getByRole("alertdialog", { name: "Confirmer la demande de suppression" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirmer" }).click();

  await expect(page.getByText("Demande en attente")).toBeVisible();
  await expect(page.getByRole("button", { name: "Annuler la demande" })).toBeVisible();

  await page.getByRole("button", { name: "Annuler la demande" }).click();

  await expect(page.getByText("Aucune demande enregistrée.")).not.toBeVisible();
  await expect(page.getByRole("main").getByText("Annulée", { exact: true })).toBeVisible();
});
