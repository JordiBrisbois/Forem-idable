"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OfferDetails } from "@/types/offerDetails";
import { offerDetailsService } from "@/services/offers/offerDetailsService";

const CACHE_TTL_MS = 10 * 60 * 1000;

type Status = "idle" | "loading" | "success" | "error";

interface CacheEntry {
  at: number;
  details: OfferDetails;
}

/** Survives panel close/reopen and in-app navigation. */
const cache = new Map<string, CacheEntry>();
/** One in-flight request per offer: opening the same offer twice fetches once. */
const inFlight = new Map<string, Promise<OfferDetails | null>>();

function freshEntry(offerId: string): OfferDetails | null {
  const entry = cache.get(offerId);
  if (!entry) return null;
  if (Date.now() - entry.at > CACHE_TTL_MS) return null;
  return entry.details;
}

function load(offerId: string, signal?: AbortSignal): Promise<OfferDetails | null> {
  const existing = inFlight.get(offerId);
  if (existing) return existing;

  const request = offerDetailsService
    .getByOfferId(offerId, { signal })
    .then((details) => {
      if (details) cache.set(offerId, { at: Date.now(), details });
      return details;
    })
    .finally(() => {
      inFlight.delete(offerId);
    });

  inFlight.set(offerId, request);
  return request;
}

/**
 * Detail of one offer, with a module cache and a single in-flight request.
 *
 * The list already renders the summary; this only adds the full text, so the
 * panel never blocks on it: it opens immediately and the detail streams in.
 */
export function useOfferDetails(options: { offerId: string | null; enabled: boolean }) {
  const { offerId, enabled } = options;
  const cached = offerId ? freshEntry(offerId) : null;
  const [details, setDetails] = useState<OfferDetails | null>(cached);
  const [status, setStatus] = useState<Status>(cached ? "success" : "idle");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!offerId || !enabled) return;

    let cancelled = false;
    const controller = new AbortController();
    abortRef.current = controller;

    void (async () => {
      const cachedDetails = freshEntry(offerId);
      if (cachedDetails) {
        setDetails(cachedDetails);
        setStatus("success");
        return;
      }

      setStatus("loading");
      setError(null);

      const result = await load(offerId, controller.signal);
      if (cancelled) return;

      if (result) {
        setDetails(result);
        setStatus("success");
      } else {
        setDetails(null);
        setStatus("error");
        setError("Détails indisponibles pour cette offre.");
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [enabled, offerId]);

  /** Warms the cache from a row hover/focus, without changing any state. */
  const prefetch = useCallback((id: string | null | undefined) => {
    if (!id) return;
    if (freshEntry(id) || inFlight.has(id)) return;
    void load(id).catch(() => undefined);
  }, []);

  return useMemo(
    () => ({ details, status, error, prefetch }),
    [details, error, prefetch, status]
  );
}

/** Test helper: drop the module cache. */
export function resetOfferDetailsCacheForTests() {
  cache.clear();
  inFlight.clear();
}
