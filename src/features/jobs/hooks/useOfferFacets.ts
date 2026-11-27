"use client";

import { useEffect, useState } from "react";

export interface OfferFacetValue {
  value: string;
  count: number;
}

export interface OfferFacets {
  regimes: OfferFacetValue[];
  sectors: OfferFacetValue[];
  languages: OfferFacetValue[];
}

const EMPTY: OfferFacets = { regimes: [], sectors: [], languages: [] };
const TTL_MS = 5 * 60 * 1000;

let cache: { at: number; facets: OfferFacets } | null = null;

async function fetchFacets(): Promise<OfferFacets> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.facets;

  const response = await fetch("/api/offers/facets", { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const facets = (await response.json()) as OfferFacets;
  cache = { at: Date.now(), facets };
  return facets;
}

/**
 * Filter values available in the mirror. Fetched once per session (the values
 * only move when the sync runs) and degraded to an empty list on failure: the
 * filters are an enhancement, never a blocker for searching.
 */
export function useOfferFacets() {
  const [facets, setFacets] = useState<OfferFacets>(cache?.facets ?? EMPTY);
  const [isLoading, setIsLoading] = useState(!cache);

  useEffect(() => {
    let mounted = true;

    void fetchFacets()
      .then((value) => {
        if (mounted) setFacets(value);
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { facets, isLoading };
}

/** Test helper: drop the module cache. */
export function resetOfferFacetsCacheForTests() {
  cache = null;
}
