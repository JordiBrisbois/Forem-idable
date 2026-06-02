import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/server/rateLimit";
import { listActiveFeaturedSearches } from "@/lib/server/featuredSearches";

export async function GET() {
  try {
    const rateLimit = await checkRateLimit({
      scope: "featured-searches",
      limit: 60,
      windowMs: 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez dans quelques instants." },
        { status: 429 }
      );
    }
    const featuredSearches = await listActiveFeaturedSearches();
    return NextResponse.json({ featuredSearches });
  } catch {
    return NextResponse.json(
      { error: "Chargement des recherches mises en avant impossible." },
      { status: 500 }
    );
  }
}
