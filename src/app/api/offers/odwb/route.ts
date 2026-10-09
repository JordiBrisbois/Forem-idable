import { NextRequest, NextResponse } from "next/server";
import { odwbApiKey } from "@/lib/odwbApiKey";
import { checkRateLimit } from "@/lib/server/rateLimit";

export const dynamic = "force-dynamic";

/**
 * Shared proxy for the ODWB "offres d'emploi FOREM" dataset.
 *
 * The browser no longer calls ODWB directly: every visitor's search goes through
 * this route, which keeps a short-lived in-memory cache keyed by the query. The
 * whole instance therefore issues a single stream of upstream calls (not one per
 * visitor), which keeps usage far below ODWB's quota.
 *
 * The optional server-side `ODWB_API_KEY` is added here and never reaches the
 * client. Only the fixed ODWB dataset URL can be reached (params are validated),
 * so there is no SSRF surface.
 */
const ODWB_RECORDS_BASE =
  "https://www.odwb.be/api/explore/v2.1/catalog/datasets/offres-d-emploi-forem/records";
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_WHERE_LENGTH = 2000;
const MAX_LIMIT = 100;
const MAX_OFFSET = 9900;

const pageCache = new Map<string, { ts: number; status: number; body: string }>();

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

  const odwbUrl = new URL(ODWB_RECORDS_BASE);
  odwbUrl.searchParams.set("limit", String(limit));
  odwbUrl.searchParams.set("offset", String(offset));
  odwbUrl.searchParams.set("order_by", "datedebutdiffusion desc");
  if (where) {
    odwbUrl.searchParams.set("where", where);
  }

  // Cache key excludes the API key so a rotating key does not fragment the cache.
  const cacheKey = odwbUrl.toString();
  const apiKey = odwbApiKey();
  if (apiKey) {
    odwbUrl.searchParams.set("apikey", apiKey);
  }

  const cached = pageCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return new NextResponse(cached.body, {
      status: cached.status,
      headers: { "content-type": "application/json; charset=utf-8", "x-cache": "hit" },
    });
  }

  let upstream: Response;
  try {
    upstream = await fetch(odwbUrl.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "Service d'offres indisponible." }, { status: 502 });
  }

  const body = await upstream.text();

  if (upstream.ok) {
    pageCache.set(cacheKey, { ts: Date.now(), status: 200, body });
  }

  return new NextResponse(body, {
    status: upstream.status,
    headers: { "content-type": "application/json; charset=utf-8", "x-cache": "miss" },
  });
}
