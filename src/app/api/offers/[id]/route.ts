import { NextRequest, NextResponse } from "next/server";
import { isValidForemOfferId } from "@/lib/forem";
import { getOfferDetail } from "@/lib/server/offers/detailService";
import { getOfferJob } from "@/lib/server/offers/repository";
import { checkRateLimit } from "@/lib/server/rateLimit";
import type { OfferDetails } from "@/types/offerDetails";

const EMPTY: OfferDetails = { source: "none", highlights: [], sections: [] };

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

    const [job, detail] = await Promise.all([getOfferJob(id), getOfferDetail(id)]);
    if (!detail) {
      return NextResponse.json(EMPTY, { headers: { "cache-control": "no-store" } });
    }

    return NextResponse.json(
      { ...detail, job },
      { headers: { "cache-control": "public, max-age=300" } }
    );
  } catch (error) {
    console.error("Offer details route error:", error);
    return NextResponse.json(EMPTY);
  }
}
