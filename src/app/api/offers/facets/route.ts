import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/server/rateLimit";
import { getOfferFacets } from "@/lib/server/offers/repository";

export const dynamic = "force-dynamic";

/**
 * Filter values present in the mirror, with counts: regimes, sectors and
 * languages. Computed from the local table, so a filter never offers a value
 * that returns nothing and no upstream call is involved.
 */
export async function GET() {
  const rateLimit = await checkRateLimit({
    scope: "offers-facets",
    limit: 60,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json({ regimes: [], sectors: [], languages: [] }, { status: 429 });
  }

  try {
    const facets = await getOfferFacets();
    return NextResponse.json(facets, {
      headers: {
        "x-offers-source": "mirror",
        // Filter values change at most once per sync.
        "cache-control": "public, max-age=60",
      },
    });
  } catch {
    return NextResponse.json({ regimes: [], sectors: [], languages: [] });
  }
}
