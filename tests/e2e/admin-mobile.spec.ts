import { devices, expect, test } from "@playwright/test";

test.use({ ...devices["Pixel 7"] });

test("renders the admin page without horizontal overflow on mobile", async ({ page }) => {
  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      json: {
        user: {
          id: 99,
          email: "admin@example.com",
          firstName: "Ada",
          lastName: "Admin",
          role: "admin",
        },
      },
    });
  });

  await page.route("**/api/applications", async (route) => {
    await route.fulfill({ json: { applications: [] } });
  });

  await page.route("**/api/coach/dashboard", async (route) => {
    await route.fulfill({
      json: {
        dashboard: {
          viewer: {
            id: 99,
            email: "admin@example.com",
            firstName: "Ada",
            lastName: "Admin",
            role: "admin",
          },
          users: [
            {
              id: 2,
              email: "coach@example.com",
              firstName: "Camille",
              lastName: "Coach",
              role: "coach",
              groupIds: [10],
              groupNames: ["Groupe Liege"],
              applicationCount: 1,
              interviewCount: 0,
              dueCount: 0,
              acceptedCount: 0,
              rejectedCount: 0,
              inProgressCount: 1,
              latestActivityAt: "2026-03-24T10:00:00.000Z",
              lastSeenAt: "2026-03-24T10:00:00.000Z",
              lastCoachActionAt: "2026-03-24T10:00:00.000Z",
              applications: [],
            },
            {
              id: 3,
              email: "user@example.com",
              firstName: "Jordi",
              lastName: "User",
              role: "user",
              groupIds: [],
              groupNames: [],
              applicationCount: 0,
              interviewCount: 0,
              dueCount: 0,
              acceptedCount: 0,
              rejectedCount: 0,
              inProgressCount: 0,
              latestActivityAt: null,
              lastSeenAt: "2026-03-24T09:00:00.000Z",
              lastCoachActionAt: null,
              applications: [],
            },
          ],
          groups: [
            {
              id: 10,
              name: "Groupe Liege",
              createdAt: "2026-03-24T09:00:00.000Z",
              createdBy: {
                id: 99,
                email: "admin@example.com",
                firstName: "Ada",
                lastName: "Admin",
              },
              managerCoachId: 2,
              members: [],
              coaches: [
                {
                  id: 2,
                  email: "coach@example.com",
                  firstName: "Camille",
                  lastName: "Coach",
                  role: "coach",
                  lastSeenAt: "2026-03-24T10:00:00.000Z",
                },
              ],
            },
          ],
          availableCoaches: [
            {
              id: 2,
              email: "coach@example.com",
              firstName: "Camille",
              lastName: "Coach",
              role: "coach",
              lastSeenAt: "2026-03-24T10:00:00.000Z",
            },
          ],
        },
      },
    });
  });

  await page.route("**/api/admin/api-keys", async (route) => {
    await route.fulfill({
      json: {
        apiKeys: [
          {
            id: 101,
            name: "Export Power Query RH",
            keyPrefix: "frmadm",
            lastFour: "7X9Q",
            createdAt: "2026-03-24T09:00:00.000Z",
            lastUsedAt: "2026-03-24T11:00:00.000Z",
            expiresAt: null,
            revokedAt: null,
            userId: 2,
            userEmail: "coach.long.email@example.com",
            userFirstName: "Camille",
            userLastName: "Coach",
            userRole: "coach",
          },
        ],
      },
    });
  });

  await page.route("**/api/admin/featured-searches", async (route) => {
    await route.fulfill({
      json: {
        featuredSearches: [
          {
            id: 1,
            title: "Maintenance Liege",
            message: "Recherche mise en avant pour la home.",
            ctaLabel: "Consulter les offres",
            query: {
              keywords: ["maintenance"],
              locations: [],
              booleanMode: "OR",
            },
            isActive: true,
            sortOrder: 0,
            createdAt: "2026-03-24T09:00:00.000Z",
            updatedAt: "2026-03-24T09:00:00.000Z",
          },
        ],
      },
    });
  });

  await page.goto("/admin");

  await expect(page.getByText("Administration", { exact: true })).toBeVisible();
  await expect(page.getByText("coach.long.email@example.com").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Revoquer" }).first()).toBeVisible();

  await expect
    .poll(async () =>
      page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      )
    )
    .toBeLessThan(2);

  await page.getByRole("link", { name: /Coachs/i }).click();
  await expect(page).toHaveURL(/#coachs$/);
});
