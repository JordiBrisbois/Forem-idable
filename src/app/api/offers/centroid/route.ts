import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/server/rateLimit";
import { getLocationCentroid } from "@/lib/server/offers/repository";

export const dynamic = "force-dynamic";

/**
 * Average position of the offers in a place, so "around me" can centre on the
 * location the visitor already typed instead of their device position.
 *
 * No geocoder: the coordinates are the ones the dataset carries.
 */
export async function GET(request: Request) {
  const rateLimit = await checkRateLimit({
    scope: "offers-centroid",
    limit: 120,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  const params = new URL(request.url).searchParams;
  const postalCode = params.get("postalCode")?.trim().slice(0, 10) || undefined;
  const name = params.get("name")?.trim().slice(0, 120) || undefined;

  if (!postalCode && !name) {
    return NextResponse.json({ error: "Lieu manquant." }, { status: 400 });
  }

  try {
    const centroid = await getLocationCentroid({ postalCode, name });
    if (!centroid) {
      return NextResponse.json({ error: "Lieu sans coordonnées." }, { status: 404 });
    }

    return NextResponse.json(centroid, {
      headers: { "cache-control": "public, max-age=300" },
    });
  } catch {
    return NextResponse.json({ error: "Indisponible." }, { status: 503 });
  }
}
