import { NextResponse } from "next/server";
import { appendOdwbApiKey } from "@/lib/odwbApiKey";
import { getOffersCacheOptions, getOffersCacheStore } from "@/lib/server/cache";
import { reserveOdwbCall } from "@/lib/server/cache/budget";
import { cachedResource } from "@/lib/server/cache/cached";
import { checkRateLimit } from "@/lib/server/rateLimit";
import { CONTRACT_TYPE_LABELS, ContractType, normalizeContractType } from "@/lib/contractType";

export const dynamic = "force-dynamic";

/**
 * Lists the contract types actually present in the ODWB dataset, with counts.
 * The search UI renders only these, so it never shows a filter that returns
 * nothing. Cached for 12h (facets are near-static), stale 48h.
 */
const FACETS_URL =
  "https://www.odwb.be/api/v2/catalog/datasets/offres-d-emploi-forem/facets?facet=typecontrat&limit=100";

interface ContractTypeOption {
  type: ContractType;
  label: string;
  count: number;
}

export async function GET() {
  const rateLimit = await checkRateLimit({
    scope: "offers-contract-types",
    limit: 30,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json({ types: [] });
  }

  const result = await cachedResource(
    getOffersCacheStore(),
    "facets:typecontrat",
    getOffersCacheOptions().facets,
    async () => {
      const budget = await reserveOdwbCall();
      if (!budget.allowed) {
        return { ok: false, status: 429, reason: "budget", budgetRemaining: 0 };
      }

      try {
        const url = appendOdwbApiKey(new URL(FACETS_URL));
        const response = await fetch(url.toString(), {
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
        });

        if (!response.ok) {
          return {
            ok: false,
            status: response.status,
            reason: "upstream",
            budgetRemaining: budget.remaining,
          };
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

        return { ok: true, value: data, budgetRemaining: budget.remaining };
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

  const headers: Record<string, string> = {};

  if (!result.ok) {
    // Never break the UI: an empty list makes the client fall back to defaults.
    headers["x-cache"] = result.reason === "budget" ? "budget" : "miss";
    return NextResponse.json({ types: [] }, { headers });
  }

  headers["x-cache"] = result.source;
  if (result.budgetRemaining !== undefined) {
    headers["x-odwb-budget-remaining"] = String(result.budgetRemaining);
  }

  return NextResponse.json({ types: result.value }, { headers });
}
