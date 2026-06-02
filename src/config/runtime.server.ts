import "server-only";

import {
  sanitizeDisplayText,
  sanitizeHyphenSlug,
  sanitizeUnderscoreSlug,
} from "@/config/runtime";

const appName =
  sanitizeDisplayText(process.env.APP_NAME) ||
  sanitizeDisplayText(process.env.PRIVACY_PROJECT_LABEL) ||
  "FOREM-idable";
const exportFilenamePrefix =
  process.env.APP_EXPORT_FILENAME_PREFIX?.trim() || sanitizeHyphenSlug(appName) || "app";
const storageNamespace =
  process.env.APP_STORAGE_NAMESPACE?.trim() ||
  sanitizeUnderscoreSlug(exportFilenamePrefix) ||
  "app";

// Server-only config: contains secrets that must never reach the client bundle.
// Importing this module from a client component will fail at build time.
export const serverConfig = {
  app: {
    sessionCookieName:
      process.env.APP_SESSION_COOKIE_NAME?.trim() || `${storageNamespace}_session`,
  },
  adzuna: {
    enabled: process.env.ADZUNA_ENABLED === "true",
    appId: process.env.ADZUNA_APP_ID?.trim() || "",
    appKey: process.env.ADZUNA_APP_KEY?.trim() || "",
    country: process.env.ADZUNA_COUNTRY?.trim() || "be",
  },
} as const;