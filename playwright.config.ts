import { defineConfig, devices } from "@playwright/test";
import {
  E2E_BASE_URL,
  E2E_SESSION_COOKIE_NAME,
  authenticatedStorageState,
} from "./tests/e2e/support/session";

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
        storageState: useRealDb ? "tests/e2e/.auth/admin.json" : authenticatedStorageState(),
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
