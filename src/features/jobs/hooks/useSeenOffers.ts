"use client";

import { useMemo } from "react";
import { createBrowserStore } from "@/lib/browserStore";

const STORAGE_KEY = "forem_idable_seen_offers";
const MAX_ENTRIES = 500;

const seenStore = createBrowserStore<string[]>({
  key: STORAGE_KEY,
  defaultValue: [],
  parse: (raw) => {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  },
});

/**
 * Offers the visitor already opened, kept locally.
 *
 * Purely cosmetic (dimmed rows) and privacy-friendly: the server never learns
 * what a visitor looked at.
 */
export function useSeenOffers() {
  const seenIds = seenStore.useValue();
  const seen = useMemo(() => new Set(seenIds), [seenIds]);

  const markSeen = (offerId: string) => {
    seenStore.update((current) =>
      current.includes(offerId) ? current : [...current, offerId].slice(-MAX_ENTRIES)
    );
  };

  return { seen, markSeen };
}

/** Test helper: drop the cached snapshot between tests. */
export function resetSeenOffersForTests() {
  seenStore.resetForTests();
}
