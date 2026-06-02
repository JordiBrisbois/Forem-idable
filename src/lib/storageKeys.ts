import { runtimeConfig } from "@/config/runtime";

const storageNamespace = runtimeConfig.app.storageNamespace;

export const STORAGE_KEYS = {
  favorites: `${storageNamespace}_favorites`,
  applications: `${storageNamespace}_applications_v1`,
  settings: `${storageNamespace}_settings`,
  searchHistory: `${storageNamespace}_search_history_v1`,
  analyticsConsent: `${storageNamespace}_analytics_consent_v1`,
  locationsCache: `${storageNamespace}_locations_cache_v1`,
  theme: "theme",
} as const;

export const ALL_STORAGE_KEYS = Object.values(STORAGE_KEYS);
