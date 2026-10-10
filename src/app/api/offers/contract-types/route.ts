import { NextResponse } from "next/server";
import { appendOdwbApiKey } from "@/lib/odwbApiKey";
import { checkRateLimit } from "@/lib/server/rateLimit";
import { CONTRACT_TYPE_LABELS, ContractType, normalizeContractType } from "@/lib/contractType";

export const dynamic = "force-dynamic";

/**
 * Lists the contract types actually present in the ODWB dataset, with counts.
 * The search UI renders only these, so it never shows a filter that returns
 * nothing. The ODWB facets API is queried once and cached for an hour.
 */
const FACETS_URL =
  "https://www.odwb.be/api/v2/catalog/datasets/offres-d-emploi-forem/facets?facet=typecontrat&limit=100";
const CACHE_TTL_MS = 60 * 60 * 1000;

interface ContractTypeOption {
  type: ContractType;
  label: string;
  count: number;
}

let cache: { ts: number; data: ContractTypeOption[] } | null = null;

export async function GET() {
  const rateLimit = await checkRateLimit({
    scope: "offers-contract-types",
    limit: 30,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json({ types: [] });
  }

  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
    return NextResponse.json({ types: cache.data });
  }

  try {
    const url = appendOdwbApiKey(new URL(FACETS_URL));
    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      return NextResponse.json({ types: [] });
    }

    const payload = (await response.json()) as {
      facets?: Array<{ name: string; facets?: Array<{ value?: string; count?: number }> }>;
    };
    const facetValues =
      payload.facets?.find((facet) => facet.name === "typecontrat")?.facets ?? [];

    const totals = new Map<ContractType, number>();
    for (const entry of facetValues) {
      const type = normalizeContractType(entry.value);
      if (type === "AUTRE") continue;
      totals.set(type, (totals.get(type) ?? 0) + Number(entry.count ?? 0));
    }

    const data: ContractTypeOption[] = [...totals.entries()]
      .map(([type, count]) => ({ type, label: CONTRACT_TYPE_LABELS[type], count }))
      .sort((a, b) => b.count - a.count);

    cache = { ts: Date.now(), data };
    return NextResponse.json({ types: data });
  } catch {
    return NextResponse.json({ types: [] });
  }
}
