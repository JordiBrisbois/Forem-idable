"use client";

import { useEffect, useState } from "react";

export interface MirrorStatusResponse {
  offers: number;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  ageMinutes: number | null;
  stale: boolean;
  newOffers: number | null;
}

const LAST_VISIT_KEY = "forem_idable_last_offers_visit";

/**
 * Reads the mirror freshness and the number of offers published since the
 * visitor's previous visit. The previous visit timestamp is stored locally, so
 * nothing about the visitor is sent to the server.
 */
export function useMirrorStatus() {
  const [status, setStatus] = useState<MirrorStatusResponse | null>(null);

  useEffect(() => {
    let mounted = true;

    let since: string | null = null;
    try {
      since = window.localStorage.getItem(LAST_VISIT_KEY);
      window.localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
    } catch {
      // Storage disabled: we simply do not show the "new offers" count.
    }

    const url = since
      ? `/api/offers/status?since=${encodeURIComponent(since)}`
      : "/api/offers/status";

    void fetch(url, { headers: { Accept: "application/json" } })
      .then(async (response) => (response.ok ? ((await response.json()) as MirrorStatusResponse) : null))
      .then((value) => {
        if (mounted && value) setStatus(value);
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  return status;
}

/** Human label for an age in minutes ("il y a 3 h"). */
export function formatFreshness(ageMinutes: number | null): string {
  if (ageMinutes === null) return "date inconnue";
  if (ageMinutes < 1) return "à l'instant";
  if (ageMinutes < 60) return `il y a ${ageMinutes} min`;

  const hours = Math.round(ageMinutes / 60);
  if (hours < 48) return `il y a ${hours} h`;

  return `il y a ${Math.round(hours / 24)} j`;
}
