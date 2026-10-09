import { sanitizeUmamiScriptUrl } from "@/lib/analytics";
import { searchGoalSchema, type SearchGoal } from "@/types/preferences";

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

export interface AppRuntimeConfig {
  app: {
    name: string;
    baseUrl: string;
    title: string;
    titleSuffix: string;
    metaDescription: string;
    tagline: string;
    sourceLinkLabel: string;
    exportFilenamePrefix: string;
    storageNamespace: string;
    sessionCookieName: string;
    calendarUidDomain: string;
    currentYear: number;
  };
  brand: {
    copyrightName: string;
    logoUrl: string;
    monogram: string;
    color: string;
  };
  privacy: {
    controllerName: string;
    contactEmail: string;
    sourceUrl: string;
    lastUpdatedLabel: string;
  };
  auth: {
    passwordResetEnabled: boolean;
  };
  umami: {
    enabled: boolean;
    websiteId: string;
    scriptUrl: string;
  };
  features: {
    jobSearch: boolean;
    publicRegistration: boolean;
  };
  defaults: {
    searchGoal: SearchGoal;
  };
}

export type RuntimeEnvSource = Record<string, string | undefined>;

export const DEFAULT_APP_NAME = "Mon établissement";

export function buildRuntimeConfig(env: RuntimeEnvSource): AppRuntimeConfig {
  const appName =
    sanitizeDisplayText(env.APP_NAME) ||
    sanitizeDisplayText(env.PRIVACY_PROJECT_LABEL) ||
    DEFAULT_APP_NAME;
  const titleSuffix = sanitizeDisplayText(env.APP_TITLE_SUFFIX) || "Accompagnement";
  const exportFilenamePrefix =
    env.APP_EXPORT_FILENAME_PREFIX?.trim() || sanitizeHyphenSlug(appName) || "app";
  const storageNamespace =
    env.APP_STORAGE_NAMESPACE?.trim() || sanitizeUnderscoreSlug(exportFilenamePrefix) || "app";
  const parsedGoal = searchGoalSchema.safeParse(env.DEFAULT_SEARCH_GOAL);
  const currentYear = new Date().getFullYear();

  return {
    app: {
      name: appName,
      baseUrl: env.APP_BASE_URL?.trim() || env.COOLIFY_URL?.trim() || "",
      title: sanitizeDisplayText(env.APP_TITLE) || `${appName} - ${titleSuffix}`,
      titleSuffix,
      metaDescription:
        sanitizeDisplayText(env.APP_META_DESCRIPTION) ||
        "Suivi d'accompagnement et recherche d'offres.",
      tagline: sanitizeDisplayText(env.APP_TAGLINE),
      sourceLinkLabel: sanitizeDisplayText(env.APP_SOURCE_LINK_LABEL) || "Code source",
      exportFilenamePrefix,
      storageNamespace,
      sessionCookieName:
        env.APP_SESSION_COOKIE_NAME?.trim() || `${storageNamespace}_session`,
      calendarUidDomain: env.APP_CALENDAR_UID_DOMAIN?.trim() || exportFilenamePrefix || "app",
      currentYear,
    },
    brand: {
      copyrightName:
        sanitizeDisplayText(env.COPYRIGHT_NAME) ||
        sanitizeDisplayText(env.PRIVACY_CONTROLLER_NAME) ||
        appName,
      logoUrl: env.APP_LOGO_URL?.trim() || "",
      monogram: sanitizeDisplayText(env.APP_LOGO_MONOGRAM),
      color: env.APP_BRAND_COLOR?.trim() || "",
    },
    privacy: {
      controllerName: sanitizeDisplayText(env.PRIVACY_CONTROLLER_NAME),
      contactEmail: env.PRIVACY_CONTACT_EMAIL?.trim() || "",
      sourceUrl: env.PRIVACY_SOURCE_URL?.trim() || "",
      lastUpdatedLabel: sanitizeDisplayText(env.PRIVACY_LAST_UPDATED_LABEL),
    },
    auth: {
      passwordResetEnabled:
        env.NEXT_PUBLIC_PASSWORD_RESET_ENABLED === "true" ||
        env.PASSWORD_RESET_ENABLED === "true",
    },
    umami: {
      enabled: env.UMAMI_ENABLED === "true",
      websiteId: env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim() || "",
      scriptUrl: sanitizeUmamiScriptUrl(env.NEXT_PUBLIC_UMAMI_SCRIPT_URL),
    },
    features: {
      jobSearch: env.FEATURE_JOB_SEARCH !== "false",
      publicRegistration: env.ALLOW_PUBLIC_REGISTRATION !== "false",
    },
    defaults: {
      searchGoal: parsedGoal.success ? parsedGoal.data : "job",
    },
  };
}

function readEnvSource(): RuntimeEnvSource {
  return {
    APP_NAME: process.env.APP_NAME,
    APP_TITLE: process.env.APP_TITLE,
    APP_TITLE_SUFFIX: process.env.APP_TITLE_SUFFIX,
    APP_META_DESCRIPTION: process.env.APP_META_DESCRIPTION,
    APP_TAGLINE: process.env.APP_TAGLINE,
    APP_SOURCE_LINK_LABEL: process.env.APP_SOURCE_LINK_LABEL,
    APP_BASE_URL: process.env.APP_BASE_URL,
    COOLIFY_URL: process.env.COOLIFY_URL,
    APP_EXPORT_FILENAME_PREFIX: process.env.APP_EXPORT_FILENAME_PREFIX,
    APP_STORAGE_NAMESPACE: process.env.APP_STORAGE_NAMESPACE,
    APP_SESSION_COOKIE_NAME: process.env.APP_SESSION_COOKIE_NAME,
    APP_CALENDAR_UID_DOMAIN: process.env.APP_CALENDAR_UID_DOMAIN,
    APP_LOGO_URL: process.env.APP_LOGO_URL,
    APP_LOGO_MONOGRAM: process.env.APP_LOGO_MONOGRAM,
    APP_BRAND_COLOR: process.env.APP_BRAND_COLOR,
    COPYRIGHT_NAME: process.env.COPYRIGHT_NAME,
    PRIVACY_PROJECT_LABEL: process.env.PRIVACY_PROJECT_LABEL,
    PRIVACY_CONTROLLER_NAME: process.env.PRIVACY_CONTROLLER_NAME,
    PRIVACY_CONTACT_EMAIL: process.env.PRIVACY_CONTACT_EMAIL,
    PRIVACY_SOURCE_URL: process.env.PRIVACY_SOURCE_URL,
    PRIVACY_LAST_UPDATED_LABEL: process.env.PRIVACY_LAST_UPDATED_LABEL,
    PASSWORD_RESET_ENABLED: process.env.PASSWORD_RESET_ENABLED,
    NEXT_PUBLIC_PASSWORD_RESET_ENABLED: process.env.NEXT_PUBLIC_PASSWORD_RESET_ENABLED,
    ALLOW_PUBLIC_REGISTRATION: process.env.ALLOW_PUBLIC_REGISTRATION,
    FEATURE_JOB_SEARCH: process.env.FEATURE_JOB_SEARCH,
    DEFAULT_SEARCH_GOAL: process.env.DEFAULT_SEARCH_GOAL,
    UMAMI_ENABLED: process.env.UMAMI_ENABLED,
    NEXT_PUBLIC_UMAMI_WEBSITE_ID: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
    NEXT_PUBLIC_UMAMI_SCRIPT_URL: process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL,
  };
}

declare global {
  // Injected by the root server layout so client components render the exact
  // same branding/config as the server, without rebuilding the app.
  var __APP_RUNTIME_CONFIG__: AppRuntimeConfig | undefined;
}

function resolveRuntimeConfig(): AppRuntimeConfig {
  if (typeof window !== "undefined" && globalThis.__APP_RUNTIME_CONFIG__) {
    return globalThis.__APP_RUNTIME_CONFIG__;
  }

  return buildRuntimeConfig(readEnvSource());
}

export const runtimeConfig: AppRuntimeConfig = resolveRuntimeConfig();

export function serializeRuntimeConfig(config: AppRuntimeConfig): string {
  return JSON.stringify(config).replace(/</g, "\\u003c");
}
