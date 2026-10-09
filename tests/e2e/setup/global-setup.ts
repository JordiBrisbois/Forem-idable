import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { E2E_BASE_URL, E2E_SESSION_COOKIE_NAME } from "../support/session";

/**
 * Real-database setup. Only runs when `E2E_REAL_DB=1` and `E2E_DATABASE_URL`
 * point at a throwaway database (never the production one):
 *   - resets the schema and re-applies migrations,
 *   - bootstraps the first admin through POST /api/setup (which also mints a
 *     session cookie),
 *   - writes the resulting cookie to `tests/e2e/.auth/admin.json` (gitignored)
 *     so specs run authenticated against the real backend.
 */
const ADMIN = {
  email: "e2e-admin@example.test",
  password: "E2e-Admin-Password-123!",
  firstName: "E2E",
  lastName: "Admin",
};

export default async function globalSetup() {
  if (process.env.E2E_REAL_DB !== "1") {
    return;
  }

  const databaseUrl = process.env.E2E_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("E2E_REAL_DB=1 requires E2E_DATABASE_URL to be set.");
  }

  console.log("[e2e] Resetting the test database...");
  execSync("node scripts/reset-demo.mjs", {
    stdio: "inherit",
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  console.log("[e2e] Bootstrapping the first admin via /api/setup...");
  const response = await fetchWithRetry(`${E2E_BASE_URL}/api/setup`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: E2E_BASE_URL },
    body: JSON.stringify(ADMIN),
  });

  if (!response.ok) {
    throw new Error(`Setup failed: ${response.status} ${await response.text()}`);
  }

  const setCookie = response.headers.get("set-cookie") ?? "";
  const match = setCookie.match(new RegExp(`${E2E_SESSION_COOKIE_NAME}=([^;]+)`));
  if (!match) {
    throw new Error("Session cookie missing from the /api/setup response.");
  }

  const stateFile = path.resolve(process.cwd(), "tests/e2e/.auth/admin.json");
  mkdirSync(path.dirname(stateFile), { recursive: true });
  writeFileSync(
    stateFile,
    JSON.stringify(
      {
        cookies: [
          {
            name: E2E_SESSION_COOKIE_NAME,
            value: match[1],
            domain: new URL(E2E_BASE_URL).hostname,
            path: "/",
            expires: -1,
            httpOnly: true,
            secure: false,
            sameSite: "Lax",
          },
        ],
        origins: [],
      },
      null,
      2
    )
  );

  console.log("[e2e] Authenticated storage state written.");
}

async function fetchWithRetry(url: string, init: RequestInit, attempts = 30, delayMs = 1000) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetch(url, init);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Fetch failed");
}
