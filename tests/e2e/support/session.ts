/**
 * Shared auth helpers for Playwright specs.
 *
 * The middleware only checks for the *presence* of the session cookie; the
 * actual validation happens in the API routes (which the specs mock). The cookie
 * name is forced via `webServer.env.APP_SESSION_COOKIE_NAME` in playwright.config
 * so it is deterministic across machines and CI.
 */
export const E2E_SESSION_COOKIE_NAME = "e2e_session";

export function e2eSessionCookie(baseURL: string | undefined) {
  const host = baseURL ? new URL(baseURL).hostname : "127.0.0.1";
  return {
    name: E2E_SESSION_COOKIE_NAME,
    value: "e2e-session",
    domain: host,
    path: "/",
  };
}
