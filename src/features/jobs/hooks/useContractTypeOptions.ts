"use client";

import { useEffect, useState } from "react";
import { CONTRACT_TYPE_LABELS, FILTERABLE_CONTRACT_TYPES, type ContractType } from "@/lib/contractType";

export interface ContractTypeOption {
  type: ContractType;
  label: string;
  count?: number;
}

const FALLBACK: ContractTypeOption[] = FILTERABLE_CONTRACT_TYPES.map((type) => ({
  type,
  label: CONTRACT_TYPE_LABELS[type],
}));

/**
 * Loads the contract types actually available in the data source (with counts),
 * so the search UI only offers filters that return results. Falls back to the
 * static list if the endpoint is unavailable.
 */
export function useContractTypeOptions(): ContractTypeOption[] {
  const [options, setOptions] = useState<ContractTypeOption[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/offers/contract-types", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { types: [] }))
      .then((data: { types?: ContractTypeOption[] }) => {
        if (!cancelled && Array.isArray(data.types) && data.types.length > 0) {
          setOptions(data.types);
        }
      })
      .catch(() => {
        // Keep the fallback list.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return options ?? FALLBACK;
}
