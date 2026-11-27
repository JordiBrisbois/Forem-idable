import {
  foremDetailUrl,
  normalizeForemDetail,
  normalizeMirrorDetail,
} from "@/lib/server/offers/detail";
import {
  getOfferDetailCache,
  getOfferPayload,
  saveOfferDetail,
} from "@/lib/server/offers/repository";
import type { OfferDetails } from "@/types/offerDetails";

const FOREM_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** A mirrored summary means "Forem does not know it": retry later, not every view. */
const MIRROR_TTL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 6000;
/** Never more than this many concurrent calls to the Forem endpoint. */
const MAX_CONCURRENCY = 2;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/** One in-flight fetch per offer: ten simultaneous openings cost one call. */
const inFlight = new Map<string, Promise<OfferDetails | null>>();

let active = 0;
const waiting: Array<() => void> = [];

async function acquire(): Promise<void> {
  if (active < MAX_CONCURRENCY) {
    active += 1;
    return;
  }
  await new Promise<void>((resolve) => waiting.push(resolve));
  active += 1;
}

function release(): void {
  active = Math.max(0, active - 1);
  waiting.shift()?.();
}

function cacheTtl(detail: OfferDetails): number {
  return detail.source === "forem-detail-api" ? FOREM_TTL_MS : MIRROR_TTL_MS;
}

async function fetchForemDetail(offerId: string): Promise<OfferDetails | null> {
  await acquire();
  try {
    const response = await fetch(foremDetailUrl(offerId), {
      headers: {
        Accept: "application/json, text/plain, */*",
        Referer: `https://www.leforem.be/recherche-offres/offre-detail/${offerId}`,
        "User-Agent": USER_AGENT,
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: "no-store",
    });

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) return null;

    const payload = (await response.json()) as Record<string, unknown>;
    // A wrong path returns the SPA shell: require the field that identifies an offer.
    if (!payload || typeof payload !== "object" || !("titreOffre" in payload)) {
      return null;
    }

    return normalizeForemDetail(payload, offerId);
  } catch {
    return null;
  } finally {
    release();
  }
}

/**
 * Fetches and stores one offer detail, deduplicated.
 *
 * Order of preference: the Forem endpoint, then the mirrored summary so the UI
 * still has the structured facts when the third party refuses or drops the
 * offer. The result is stored either way, which is what stops a dead offer from
 * being retried on every view.
 */
async function resolveDetail(offerId: string): Promise<OfferDetails | null> {
  const existing = inFlight.get(offerId);
  if (existing) return existing;

  const request = (async () => {
    const remote = await fetchForemDetail(offerId);
    if (remote) {
      await saveOfferDetail(offerId, remote).catch(() => undefined);
      return remote;
    }

    const mirrored = await getOfferPayload(offerId);
    if (!mirrored) return null;

    const fallback: OfferDetails = {
      ...normalizeMirrorDetail(mirrored, offerId),
      source: "mirror",
    };
    await saveOfferDetail(offerId, fallback).catch(() => undefined);
    return fallback;
  })().finally(() => inFlight.delete(offerId));

  inFlight.set(offerId, request);
  return request;
}

/**
 * Cached detail of one offer, refreshed in the background when it gets old.
 *
 * Shared by the details API and the public offer page so both obey the same
 * cache policy instead of each inventing one.
 */
export async function getOfferDetail(offerId: string): Promise<OfferDetails | null> {
  const cached = await getOfferDetailCache(offerId);

  if (cached) {
    const isFresh = Date.now() - cached.fetchedAt.getTime() <= cacheTtl(cached.detail);
    if (!isFresh) {
      void resolveDetail(offerId).catch(() => undefined);
    }
    return cached.detail;
  }

  return resolveDetail(offerId);
}

/** Test helper: reset the in-process dedupe state. */
export function resetOfferDetailServiceForTests() {
  inFlight.clear();
  active = 0;
  waiting.length = 0;
}
