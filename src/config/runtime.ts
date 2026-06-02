import { sanitizeUmamiScriptUrl } from "@/lib/analytics";

export function sanitizeDisplayText(value?: string) {
  return value?.trim().replace(/\\(['"])/g, "$1") || "";
}

export function sanitizeHyphenSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function sanitizeUnderscoreSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");
}

// Legacy fallback kept for existing deployments that still define PRIVACY_PROJECT_LABEL.
const appName =
  sanitizeDisplayText(process.env.APP_NAME) ||
  sanitizeDisplayText(process.env.PRIVACY_PROJECT_LABEL) ||
  "FOREM-idable";
const titleSuffix = sanitizeDisplayText(process.env.APP_TITLE_SUFFIX) || "Indexeur d'offres";
const exportFilenamePrefix =
  process.env.APP_EXPORT_FILENAME_PREFIX?.trim() || sanitizeHyphenSlug(appName) || "app";
const storageNamespace =
  process.env.APP_STORAGE_NAMESPACE?.trim() ||
  sanitizeUnderscoreSlug(exportFilenamePrefix) ||
  "app";
const currentYear = new Date().getFullYear();

export const runtimeConfig = {
  app: {
    name: appName,
    baseUrl: process.env.APP_BASE_URL?.trim() || process.env.COOLIFY_URL?.trim() || "",
    title: sanitizeDisplayText(process.env.APP_TITLE) || `${appName} - ${titleSuffix}`,
    titleSuffix,
    metaDescription: sanitizeDisplayText(process.env.APP_META_DESCRIPTION)
      || "Recherche d'offres d'emploi du Forem, simplifiée et décomplexée.",
    tagline: sanitizeDisplayText(process.env.APP_TAGLINE) || "L'indexeur d'offres décomplexé",
    sourceLinkLabel:
      sanitizeDisplayText(process.env.APP_SOURCE_LINK_LABEL) || "Code source AGPLv3",
    exportFilenamePrefix,
    storageNamespace,
    calendarUidDomain:
      process.env.APP_CALENDAR_UID_DOMAIN?.trim() || exportFilenamePrefix || "app",
    currentYear,
  },
  brand: {
    copyrightName:
      sanitizeDisplayText(process.env.COPYRIGHT_NAME) ||
      sanitizeDisplayText(process.env.PRIVACY_CONTROLLER_NAME) ||
      "Jordi Brisbois",
  },
  auth: {
    passwordResetEnabled: process.env.NEXT_PUBLIC_PASSWORD_RESET_ENABLED === "true",
  },
  umami: {
    enabled: process.env.UMAMI_ENABLED === "true",
    websiteId: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim() || "",
    scriptUrl: sanitizeUmamiScriptUrl(process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL),
  },
  privacy: {
    controllerName: sanitizeDisplayText(process.env.PRIVACY_CONTROLLER_NAME) || "Jordi Brisbois",
    contactEmail: process.env.PRIVACY_CONTACT_EMAIL?.trim() || "RGPD@brisbois.dev",
    sourceUrl:
      process.env.PRIVACY_SOURCE_URL?.trim() || "https://github.com/VoxSake/FOREM-idable",
    lastUpdatedLabel: sanitizeDisplayText(process.env.PRIVACY_LAST_UPDATED_LABEL) || "25 mars 2026",
  },
};
