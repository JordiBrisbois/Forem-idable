import { NextResponse } from "next/server";
import { z } from "zod";
import { contractTypeSchema } from "@/lib/contractType";
import { checkRateLimit } from "@/lib/server/rateLimit";
import { needsInitialSync, searchOffers } from "@/lib/server/offers/repository";

export const dynamic = "force-dynamic";

const MAX_RESULTS_PER_PAGE = 100;
const MAX_OFFSET = 9900;

const locationSchema = z.object({
  id: z.string().max(40).optional(),
  name: z.string().min(1).max(120),
  type: z.enum(["Pays", "Régions", "Provinces", "Arrondissements", "Communes", "Localités"]),
  postalCode: z.string().max(10).optional(),
  code: z.string().max(10).optional(),
});

const searchBodySchema = z.object({
  keywords: z.array(z.string().min(1).max(80)).max(10).optional(),
  booleanMode: z.enum(["AND", "OR"]).optional(),
  contractTypes: z.array(contractTypeSchema).max(12).optional(),
  locations: z.array(locationSchema).max(10).optional(),
  limit: z.number().int().min(1).max(MAX_RESULTS_PER_PAGE).optional(),
  offset: z.number().int().min(0).max(MAX_OFFSET).optional(),
});

/**
 * Searches the local mirror of the Forem offers dataset.
 *
 * This route never calls ODWB: the mirror is refreshed by the sync worker, which
 * is what removes the shared upstream quota from the search path entirely.
 */
export async function POST(request: Request) {
  const rateLimit = await checkRateLimit({
    scope: "offers-search",
    limit: 120,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Trop de requêtes. Réessayez dans quelques instants.", reason: "rate_limited" },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const parsed = searchBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres de recherche invalides." },
      { status: 400 }
    );
  }

  try {
    const result = await searchOffers({
      keywords: parsed.data.keywords,
      booleanMode: parsed.data.booleanMode,
      contractTypes: parsed.data.contractTypes,
      locations: parsed.data.locations,
      limit: parsed.data.limit ?? MAX_RESULTS_PER_PAGE,
      offset: parsed.data.offset ?? 0,
    });

    // An empty mirror means the first sync has not landed yet: say so, instead
    // of pretending the search legitimately returned nothing.
    if (result.total === 0 && (await needsInitialSync())) {
      return NextResponse.json(
        { jobs: [], total: 0, indexing: true },
        { headers: { "x-offers-source": "mirror" } }
      );
    }

    return NextResponse.json(result, {
      headers: { "x-offers-source": "mirror" },
    });
  } catch {
    // The mirror is a database read: a failure here is ours, not the provider's.
    return NextResponse.json(
      { error: "Service d'offres indisponible.", reason: "unavailable" },
      { status: 503 }
    );
  }
}
