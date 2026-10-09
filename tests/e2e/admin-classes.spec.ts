import { expect, test, type Route } from "@playwright/test";

function fulfillJson(route: Route, json: unknown, status = 200) {
  return route.fulfill({ status, json });
}

test("an admin can create a class from the admin console", async ({ page, context }) => {
  let createdName: string | null = null;

  // The middleware only checks the presence of the session cookie.
  await context.addCookies([
    {
      name: "forem_idable_session",
      value: "e2e-session",
      domain: "127.0.0.1",
      path: "/",
    },
  ]);

  await page.route("**/api/auth/me", (route) =>
    fulfillJson(route, {
      user: {
        id: 1,
        email: "admin@example.com",
        firstName: "Ada",
        lastName: "Admin",
        role: "admin",
      },
    })
  );

  await page.route("**/api/coach/dashboard", (route) =>
    fulfillJson(route, {
      dashboard: {
        viewer: {
          id: 1,
          email: "admin@example.com",
          firstName: "Ada",
          lastName: "Admin",
          role: "admin",
        },
        users: [],
        groups: [],
        availableCoaches: [],
      },
    })
  );

  // Other admin endpoints are not needed for this flow.
  await page.route("**/api/admin/**", (route) => fulfillJson(route, {}));

  await page.route("**/api/coach/groups", async (route) => {
    if (route.request().method() === "POST") {
      createdName = (route.request().postDataJSON() as { name: string }).name;
      await fulfillJson(route, { group: { id: 1 } }, 201);
      return;
    }
    await fulfillJson(route, {});
  });

  await page.goto("/admin");

  await page.getByRole("button", { name: "Créer une classe" }).click();
  await page.getByLabel("Nom de la classe").fill("Promo 2026");
  await page.getByRole("button", { name: "Créer", exact: true }).click();

  await expect.poll(() => createdName).toBe("Promo 2026");
});
