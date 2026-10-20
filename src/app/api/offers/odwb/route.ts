import { NextRequest, NextResponse } from "next/server";
import { odwbApiKey } from "@/lib/odwbApiKey";
import { getOffersCacheOptions, getOffersCacheStore } from "@/lib/server/cache";
import { reserveOdwbCall } from "@/lib/server/cache/budget";
import { cachedResource } from "@/lib/server/cache/cached";
import { checkRateLimit } from "@/lib/server/rateLimit";

export const dynamic = "force-dynamic";

/**
 * Shared proxy for the ODWB "offres d'emploi FOREM" dataset.
 *
 * Search goes through this route (never directly from the browser) so the whole
 * instance shares one cached stream of upstream calls and the API key never
 * reaches the client. The cache is L1 memory + optional L2 Redis, with
 * stale-on-error and a hard upstream budget (see `cache/budget.ts`).
 *
 * Only the fixed ODWB dataset URL can be reached (params are validated), so
 * there is no SSRF surface.
 */
const ODWB_RECORDS_BASE =
  "https://www.odwb.be/api/explore/v2.1/catalog/datasets/offres-d-emploi-forem/records";
const MAX_WHERE_LENGTH = 2000;
const MAX_LIMIT = 100;
const MAX_OFFSET = 9900;

function parseBounded(value: string | null, min: number, max: number): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) return null;
  return parsed;
}

export async function GET(request: NextRequest) {
  const rateLimit = await checkRateLimit({
    scope: "offers-odwb",
    limit: 120,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Trop de requêtes. Réessayez dans quelques instants." },
      { status: 429 }
    );
  }

  const params = request.nextUrl.searchParams;
  const limit = parseBounded(params.get("limit"), 1, MAX_LIMIT);
  const offset = parseBounded(params.get("offset"), 0, MAX_OFFSET);
  if (limit === null || offset === null) {
    return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
  }

  const where = params.get("where");
  if (where !== null && where.length > MAX_WHERE_LENGTH) {
    return NextResponse.json({ error: "Filtre de recherche trop long." }, { status: 400 });
  }

  // Canonical upstream URL, deliberately WITHOUT the API key: the key must not
  // fragment the cache, and it is added only to the real upstream call.
  const upstreamUrl = new URL(ODWB_RECORDS_BASE);
  upstreamUrl.searchParams.set("limit", String(limit));
  upstreamUrl.searchParams.set("offset", String(offset));
  upstreamUrl.searchParams.set("order_by", "datedebutdiffusion desc");
  if (where) {
    upstreamUrl.searchParams.set("where", where);
  }
  const cacheKey = upstreamUrl.toString();

  const result = await cachedResource(
    getOffersCacheStore(),
    `page:${cacheKey}`,
    getOffersCacheOptions().page,
    async () => {
      const budget = await reserveOdwbCall();
      if (!budget.allowed) {
        return {
          ok: false,
          status: 429,
          reason: "budget",
          budgetRemaining: 0,
          body: JSON.stringify({
            error: "Quota d'appels au service d'offres atteint. Réessayez plus tard.",
          }),
        };
      }

      const target = new URL(cacheKey);
      const apiKey = odwbApiKey();
      if (apiKey) {
        target.searchParams.set("apikey", apiKey);
      }

      try {
        const upstream = await fetch(target.toString(), {
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
        });
        const body = await upstream.text();

        if (!upstream.ok) {
          return {
            ok: false,
            status: upstream.status,
            reason: "upstream",
            body,
            budgetRemaining: budget.remaining,
          };
        }

        return { ok: true, value: { status: 200, body }, budgetRemaining: budget.remaining };
      } catch {
        return {
          ok: false,
          status: 502,
          reason: "upstream",
          budgetRemaining: budget.remaining,
        };
      }
    }
  );

  if (!result.ok) {
    return new NextResponse(
      result.body ?? JSON.stringify({ error: "Service d'offres indisponible." }),
      {
        status: result.status,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "x-cache": result.reason === "budget" ? "budget" : "miss",
        },
      }
    );
  }

  const headers: Record<string, string> = {
    "content-type": "application/json; charset=utf-8",
    "x-cache": result.source,
  };
  if (result.budgetRemaining !== undefined) {
    headers["x-odwb-budget-remaining"] = String(result.budgetRemaining);
  }

  return new NextResponse(result.value.body, {
    status: result.value.status,
    headers,
  });
}
