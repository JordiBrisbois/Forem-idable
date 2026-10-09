import "server-only";

// Server-only config: contains secrets that must never reach the client bundle.
// Importing this module from a client component will fail at build time.
//
// Note: the session cookie name intentionally lives in `@/config/runtime`
// (client-safe) so the middleware and the auth layer always agree, even when
// `APP_SESSION_COOKIE_NAME` is customized.
export const serverConfig = {
  adzuna: {
    enabled: process.env.ADZUNA_ENABLED === "true",
    appId: process.env.ADZUNA_APP_ID?.trim() || "",
    appKey: process.env.ADZUNA_APP_KEY?.trim() || "",
    country: process.env.ADZUNA_COUNTRY?.trim() || "be",
  },
} as const;
