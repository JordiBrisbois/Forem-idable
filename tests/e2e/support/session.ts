/**
 * Shared auth helpers for Playwright specs.
 *
 * The middleware only checks for the *presence* of the session cookie; the API
 * routes (mocked per spec via `page.route`) do the real validation. We therefore
 * pre-load a deterministic cookie through Playwright's `storageState` so every
 * authenticated spec starts logged-in without needing a database.
 *
 * The cookie name is forced on the dev server via
 * `webServer.env.APP_SESSION_COOKIE_NAME` in playwright.config so it matches
 * across machines and CI. Specs that must stay logged-out use
 * `test.use({ storageState: emptyStorageState() })`.
 */
export const E2E_SESSION_COOKIE_NAME = "e2e_session";

export const E2E_BASE_URL = "http://127.0.0.1:3001";

export function e2eSessionCookie(baseURL: string = E2E_BASE_URL) {
  const host = new URL(baseURL).hostname;
  return {
    name: E2E_SESSION_COOKIE_NAME,
    value: "e2e-session",
    domain: host,
    path: "/",
    expires: -1,
    httpOnly: true,
    secure: false,
    sameSite: "Lax" as const,
  };
}

export function authenticatedStorageState(baseURL: string = E2E_BASE_URL) {
  return { cookies: [e2eSessionCookie(baseURL)], origins: [] as never[] };
}

export function emptyStorageState() {
  return { cookies: [], origins: [] as never[] };
}
