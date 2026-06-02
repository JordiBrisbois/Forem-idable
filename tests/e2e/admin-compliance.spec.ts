import { expect, test } from "@playwright/test";

test("admin can create legal holds from deletion requests, applications, and conversations", async ({
  page,
}) => {
  const createdPayloads: Array<{
    targetType: "user" | "application" | "conversation";
    targetId: number;
    reason: string;
  }> = [];
  let legalHolds: Array<{
    id: number;
    targetType: "user" | "application" | "conversation";
    targetId: number;
    reason: string;
    createdAt: string;
    releasedAt: string | null;
  }> = [];

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
          users: [
            {
              id: 41,
              email: "user@example.test",
              firstName: "Jordi",
              lastName: "Brisbois",
              role: "user",
              groupIds: [],
              groupNames: [],
              applicationCount: 1,
              interviewCount: 0,
              dueCount: 0,
              acceptedCount: 0,
              rejectedCount: 0,
              inProgressCount: 1,
              latestActivityAt: "2026-03-25T16:05:00.000Z",
              lastSeenAt: null,
              lastCoachActionAt: null,
              applications: [],
            },
          ],
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

  await page.route("**/api/admin/disclosure-logs", async (route) => {
    await route.fulfill({ json: { logs: [] } });
  });

  await page.route("**/api/admin/account-deletion-requests", async (route) => {
    await route.fulfill({
      json: {
        requests: [
          {
            id: 1,
            status: "pending",
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
        ],
      },
    });
  });

  await page.route("**/api/admin/legal-holds", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: { holds: legalHolds } });
      return;
    }

    const body = (await route.request().postDataJSON()) as {
      targetType: "user" | "application" | "conversation";
      targetId: number;
      reason: string;
    };

    createdPayloads.push(body);
    const hold = {
      id: legalHolds.length + 1,
      targetType: body.targetType,
      targetId: body.targetId,
      reason: body.reason,
      createdAt: "2026-03-25T16:30:00.000Z",
      releasedAt: null,
    };
    legalHolds = [hold, ...legalHolds];

    await route.fulfill({
      status: 201,
      json: {
        hold,
      },
    });
  });

  await page.route("**/api/admin/legal-hold-targets?*", async (route) => {
    const url = new URL(route.request().url());
    const targetType = url.searchParams.get("targetType");

    if (targetType === "application") {
      await route.fulfill({
        json: {
          options: [
            {
              id: 501,
              label: "Développeur Frontend",
              description: "Jordi Brisbois · ACME · En cours",
            },
          ],
        },
      });
      return;
    }

    await route.fulfill({
      json: {
        options: [
          {
            id: 77,
            label: "Jordi Brisbois · Ada Admin",
            description: "DM · user@example.test · admin@example.test",
          },
        ],
      },
    });
  });

  await page.goto("/admin");

  await expect(page.locator("#conformite").getByText("Conformité", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Legal hold", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Créer un legal hold" })).toBeVisible();
  await page.getByLabel("Motif").fill("Gel du compte pendant la revue.");
  await page.getByRole("button", { name: "Créer le legal hold" }).click();

  await expect(page.getByText("ID 41")).toBeVisible();
  expect(createdPayloads[0]).toEqual({
    targetType: "user",
    targetId: 41,
    reason: "Gel du compte pendant la revue.",
  });

  await page.locator("#conformite").getByRole("button", { name: "Ajouter", exact: true }).click();
  await page.getByLabel("Type de cible").click();
  await page.getByRole("option", { name: "Candidature" }).click();
  await page.getByText("Sélectionner une candidature").click();
  await page.getByPlaceholder("Rechercher une candidature...").fill("frontend");
  await page.getByRole("option", { name: /Développeur Frontend/ }).click();
  await page.getByLabel("Motif").fill("Gel de la candidature pendant le litige.");
  await page.getByRole("button", { name: "Créer le legal hold" }).click();

  await expect(page.getByText("ID 501")).toBeVisible();
  expect(createdPayloads[1]).toEqual({
    targetType: "application",
    targetId: 501,
    reason: "Gel de la candidature pendant le litige.",
  });

  await page.locator("#conformite").getByRole("button", { name: "Ajouter", exact: true }).click();
  await page.getByLabel("Type de cible").click();
  await page.getByRole("option", { name: "Conversation" }).click();
  await page.getByText("Sélectionner une conversation").click();
  await page.getByPlaceholder("Rechercher une conversation...").fill("jordi");
  await page.getByRole("option", { name: /Jordi Brisbois · Ada Admin/ }).click();
  await page.getByLabel("Motif").fill("Conversation conservée pour instruction.");
  await page.getByRole("button", { name: "Créer le legal hold" }).click();

  await expect(page.getByText("ID 77")).toBeVisible();
  expect(createdPayloads[2]).toEqual({
    targetType: "conversation",
    targetId: 77,
    reason: "Conversation conservée pour instruction.",
  });
});
