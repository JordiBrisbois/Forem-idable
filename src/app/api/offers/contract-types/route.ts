import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/server/rateLimit";
import { countOffersByContractType } from "@/lib/server/offers/repository";
import { CONTRACT_TYPE_LABELS } from "@/lib/contractType";

export const dynamic = "force-dynamic";

interface ContractTypeOption {
  type: string;
  label: string;
  count: number;
}

/**
 * Lists the contract types present in the mirrored dataset, with counts.
 *
 * Computed from the mirror (a GROUP BY on 24k rows) instead of the ODWB facet
 * API: the UI renders this on every search page, and a facet call is exactly the
 * kind of request that used to exhaust the shared dataset quota.
 */
export async function GET() {
  const rateLimit = await checkRateLimit({
    scope: "offers-contract-types",
    limit: 30,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json({ types: [] });
  }

  try {
    const counts = await countOffersByContractType();
    const types: ContractTypeOption[] = counts.map((entry) => ({
      type: entry.type,
      label: CONTRACT_TYPE_LABELS[entry.type],
      count: entry.count,
    }));

    return NextResponse.json({ types }, { headers: { "x-offers-source": "mirror" } });
  } catch {
    // Never break the UI: an empty list makes the client fall back to defaults.
    return NextResponse.json({ types: [] });
  }
}
