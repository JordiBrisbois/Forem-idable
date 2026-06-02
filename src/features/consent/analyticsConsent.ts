"use client";

import { useSyncExternalStore } from "react";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { runtimeConfig } from "@/config/runtime";

export type AnalyticsConsentChoice = "accepted" | "rejected" | null;

const CONSENT_STORAGE_KEY = STORAGE_KEYS.analyticsConsent;
const CONSENT_CHANGE_EVENT = `${runtimeConfig.app.storageNamespace.replaceAll("_", "-")}:analytics-consent-change`;

function readChoiceFromStorage(): AnalyticsConsentChoice {
  if (typeof window === "undefined") return null;

  try {
    const value = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (value === "accepted" || value === "rejected") return value;
  } catch {
    // Ignore storage read failures and keep no-consent default
  }

  return null;
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === CONSENT_STORAGE_KEY) {
      onStoreChange();
    }
  };

  const handleConsentChange = () => onStoreChange();

  window.addEventListener("storage", handleStorage);
  window.addEventListener(CONSENT_CHANGE_EVENT, handleConsentChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CONSENT_CHANGE_EVENT, handleConsentChange);
  };
}

export function useAnalyticsConsentChoice() {
  return useSyncExternalStore(subscribe, readChoiceFromStorage, () => null);
}

export function setAnalyticsConsentChoice(choice: Exclude<AnalyticsConsentChoice, null>) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // Ignore storage write failures
  }

  window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
}
