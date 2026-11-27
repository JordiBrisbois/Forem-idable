"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "forem_idable_seen_offers";
const MAX_ENTRIES = 500;

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(-MAX_ENTRIES)));
  } catch {
    // Private mode / quota: the feature degrades to "nothing seen".
  }
}

/**
 * Offers the visitor already opened, kept locally.
 *
 * Purely cosmetic (dimmed rows) and privacy-friendly: the server never learns
 * what a visitor looked at.
 */
export function useSeenOffers() {
  const [seen, setSeen] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSeen(new Set(read()));
  }, []);

  const markSeen = useCallback((offerId: string) => {
    setSeen((current) => {
      if (current.has(offerId)) return current;
      const next = new Set(current);
      next.add(offerId);
      write([...next]);
      return next;
    });
  }, []);

  return { seen, markSeen };
}
