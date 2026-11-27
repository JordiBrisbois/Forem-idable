import { NextRequest, NextResponse } from "next/server";
import { isValidForemOfferId } from "@/lib/forem";
import {
  foremDetailUrl,
  normalizeForemDetail,
  normalizeMirrorDetail,
} from "@/lib/server/offers/detail";
import {
  getCachedOfferDetail,
  getOfferPayload,
  saveOfferDetail,
} from "@/lib/server/offers/repository";
import { checkRateLimit } from "@/lib/server/rateLimit";
import type { OfferDetails } from "@/types/offerDetails";

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 6000;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const EMPTY: OfferDetails = { source: "none", highlights: [], sections: [] };

/**
 * Fetches the full offer from the Forem front-end endpoint.
 *
 * The ODWB dataset only carries a structured summary (no description), so this
 * is the only way to show what the offer actually says. It is fetched once and
 * cached for a week; a failure returns null and the caller falls back to the
 * mirror.
 */
async function fetchForemDetail(offerId: string): Promise<OfferDetails | null> {
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
    // The endpoint answers JSON for offers, but a wrong path returns the SPA
    // shell: require the field that identifies a real offer.
    if (!payload || typeof payload !== "object" || !("titreOffre" in payload)) {
      return null;
    }

    return normalizeForemDetail(payload, offerId);
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimit = await checkRateLimit({
      scope: "offer-detail",
      limit: 60,
      windowMs: 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez dans quelques instants." },
        { status: 429 }
      );
    }

    const { id } = await context.params;
    if (!id) return new NextResponse("Missing offer id", { status: 400 });
    if (!isValidForemOfferId(id)) {
      return new NextResponse("Invalid offer id", { status: 400 });
    }

    const cached = await getCachedOfferDetail(id, CACHE_TTL_MS);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "cache-control": "public, max-age=300" },
      });
    }

    const detail = await fetchForemDetail(id);
    if (detail) {
      await saveOfferDetail(id, detail).catch(() => undefined);
      return NextResponse.json(detail, {
        headers: { "cache-control": "public, max-age=300" },
      });
    }

    // Forem unreachable, refused, or the offer is gone: serve what the mirror
    // already knows instead of an empty sheet.
    const mirrored = await getOfferPayload(id);
    if (!mirrored) {
      return NextResponse.json(EMPTY, { headers: { "cache-control": "no-store" } });
    }

    return NextResponse.json(normalizeMirrorDetail(mirrored, id), {
      headers: { "cache-control": "public, max-age=60" },
    });
  } catch (error) {
    console.error("Offer details route error:", error);
    return NextResponse.json(EMPTY);
  }
}
