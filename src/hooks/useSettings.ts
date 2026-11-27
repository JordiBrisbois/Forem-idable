"use client";

import { useSyncExternalStore } from "react";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { createBrowserStore } from "@/lib/browserStore";

export interface UserSettings {
  theme: "light" | "dark" | "system";
  defaultSearchMode: "OR" | "AND";
}

const defaultSettings: UserSettings = {
  theme: "light",
  defaultSearchMode: "OR",
};

const settingsStore = createBrowserStore<UserSettings>({
  key: STORAGE_KEYS.settings,
  defaultValue: defaultSettings,
  parse: (raw) => ({ ...defaultSettings, ...(JSON.parse(raw) as Partial<UserSettings>) }),
});

const subscribeToNothing = () => () => {};

/** True once the client has taken over (the server cannot know the settings). */
function useIsHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false
  );
}

/**
 * User preferences, read from `localStorage` through an external store.
 *
 * The previous version hydrated with a `setState` inside an effect, which caused
 * an extra render pass on every page and a flash of default settings.
 */
export function useSettings() {
  const settings = settingsStore.useValue();
  const isLoaded = useIsHydrated();

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    settingsStore.update((current) => ({ ...current, ...newSettings }));
  };

  return { settings, updateSettings, isLoaded };
}
