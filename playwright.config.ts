import { defineConfig, devices } from "@playwright/test";

/**
 * Auth/DB constants for the E2E suite. They are intentionally duplicated from
 * `tests/e2e/support/session.ts` instead of imported: the Next.js Docker build
 * excludes `tests/` (see .dockerignore), so this root config must stay
 * self-contained to type-check during `next build`.
 *
 * Keep the cookie name/value in sync with tests/e2e/support/session.ts.
 */
const E2E_BASE_URL = "http://127.0.0.1:3001";
const E2E_SESSION_COOKIE_NAME = "e2e_session";

const authenticatedState = {
  cookies: [
    {
      name: E2E_SESSION_COOKIE_NAME,
      value: "e2e-session",
      domain: "127.0.0.1",
      path: "/",
      expires: -1,
      httpOnly: true,
      secure: false,
      sameSite: "Lax" as const,
    },
  ],
  origins: [],
};

const useRealDb = process.env.E2E_REAL_DB === "1";
const realDatabaseUrl = process.env.E2E_DATABASE_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  globalSetup: useRealDb ? "./tests/e2e/setup/global-setup.ts" : undefined,
  use: {
    baseURL: E2E_BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: useRealDb ? "tests/e2e/.auth/admin.json" : authenticatedState,
      },
    },
  ],
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3001",
    url: E2E_BASE_URL,
    reuseExistingServer: !process.env.CI && !useRealDb,
    timeout: 120_000,
    env: {
      // Deterministic session cookie name so specs can pre-set it.
      APP_SESSION_COOKIE_NAME: E2E_SESSION_COOKIE_NAME,
      // Point the dev server at the throwaway database when running for real.
      ...(useRealDb && realDatabaseUrl ? { DATABASE_URL: realDatabaseUrl } : {}),
    },
  },
});
