import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { E2E_BASE_URL } from "../support/session";

// Only runs with a real throwaway database: `E2E_REAL_DB=1 E2E_DATABASE_URL=...`.
test.skip(process.env.E2E_REAL_DB !== "1", "Requires E2E_REAL_DB=1 and E2E_DATABASE_URL");

/**
 * The `request` fixture does not reliably apply the project storageState, so we
 * attach the session cookie minted by the global setup explicitly.
 */
function sessionCookieHeader() {
  const stateFile = path.resolve(process.cwd(), "tests/e2e/.auth/admin.json");
  const state = JSON.parse(readFileSync(stateFile, "utf8")) as {
    cookies: Array<{ name: string; value: string }>;
  };
  return state.cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

test("an admin can create a class and see it on the dashboard (real backend)", async ({
  request,
}) => {
  const cookie = sessionCookieHeader();
  const authHeaders = { origin: E2E_BASE_URL, cookie };

  const name = `Classe E2E ${Date.now()}`;

  const created = await request.post("/api/coach/groups", {
    data: { name },
    headers: authHeaders,
  });
  expect(created.status()).toBe(200);

  const dashboard = await request.get("/api/coach/dashboard", { headers: authHeaders });
  const dashboardText = await dashboard.text();
  expect(
    dashboard.ok(),
    `dashboard responded ${dashboard.status()}: ${dashboardText}`
  ).toBeTruthy();
  expect(dashboardText).toContain(name);
});
