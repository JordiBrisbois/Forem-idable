import { z } from "zod";

export const CONTRACT_TYPES = [
  "STAGE",
  "CDI",
  "CDD",
  "ALTERNANCE",
  "INTERIM",
  "FREELANCE",
  "VIE",
  "CONTRAT_PRO",
  "AUTRE",
] as const;

export type ContractType = (typeof CONTRACT_TYPES)[number];

export const contractTypeSchema = z.enum(CONTRACT_TYPES);

/** Human-readable French labels for contract types. */
export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  STAGE: "Stage",
  CDI: "CDI",
  CDD: "CDD",
  ALTERNANCE: "Alternance",
  INTERIM: "Intérim",
  FREELANCE: "Freelance",
  VIE: "VIE",
  CONTRAT_PRO: "Contrat pro",
  AUTRE: "Autre",
};

/** Contract types exposed as search filters (AUTRE is not a useful filter). */
export const FILTERABLE_CONTRACT_TYPES = CONTRACT_TYPES.filter(
  (type) => type !== "AUTRE"
);

export function normalizeContractType(value: string | null | undefined): ContractType {
  if (!value) return "AUTRE";
  const n = value.toUpperCase().trim();

  if (n.includes("STAGE") || n.includes("STAGIAIRE")) return "STAGE";
  if (n === "CDI") return "CDI";
  if (n === "CDD") return "CDD";
  if (n.includes("ALTERNANCE") || n.includes("APPRENTISSAGE")) return "ALTERNANCE";
  if (n.includes("INTERIM") || n.includes("INTÉRIM")) return "INTERIM";
  if (n.includes("FREELANCE") || n.includes("INDÉPENDANT")) return "FREELANCE";
  if (n === "VIE" || n.includes("VOLONTARIAT")) return "VIE";
  if (n.includes("CONTRAT PRO")) return "CONTRAT_PRO";

  return "AUTRE";
}
