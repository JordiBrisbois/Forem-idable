import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/server/rateLimit";
import { countOffersFirstSeenSince, getMirrorStatus } from "@/lib/server/offers/repository";

export const dynamic = "force-dynamic";

const STALE_AFTER_MS = 36 * 60 * 60 * 1000;

/**
 * Freshness of the offers mirror, plus how many offers appeared since the
 * caller's previous visit (`?since=ISO`).
 *
 * Public on purpose: the results page shows it to anonymous visitors too, and it
 * is what turns "is this list up to date?" into a fact.
 */
export async function GET(request: Request) {
  const rateLimit = await checkRateLimit({
    scope: "offers-status",
    limit: 120,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  const sinceParam = new URL(request.url).searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : null;

  try {
    const status = await getMirrorStatus(STALE_AFTER_MS);
    const newOffers =
      since && Number.isFinite(since.getTime())
        ? await countOffersFirstSeenSince(since)
        : null;

    return NextResponse.json(
      { ...status, newOffers },
      { headers: { "cache-control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { offers: 0, lastSyncAt: null, lastSyncStatus: null, ageMinutes: null, stale: true, newOffers: null },
      { status: 503 }
    );
  }
}
