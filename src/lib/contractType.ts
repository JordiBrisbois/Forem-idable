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
  FREELANCE: "Indépendant",
  VIE: "VIE",
  CONTRAT_PRO: "Contrat pro",
  AUTRE: "Autre",
};

/** Contract types exposed as search filters (AUTRE is not a useful filter). */
export const FILTERABLE_CONTRACT_TYPES = CONTRACT_TYPES.filter(
  (type) => type !== "AUTRE"
);

function deaccent(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Maps a free-form contract label to a normalized type. The source data (ODWB)
 * uses long French labels ("Durée indéterminée", "Intérimaire avec option sur
 * durée indéterminée"…), so matching is accent-insensitive and substring-based.
 */
export function normalizeContractType(value: string | null | undefined): ContractType {
  if (!value) return "AUTRE";
  const n = deaccent(value).toUpperCase().trim();
  if (!n) return "AUTRE";

  if (n.includes("STAGE") || n.includes("STAGIAIRE")) return "STAGE";
  if (n.includes("ALTERNANCE") || n.includes("APPRENTISSAGE")) return "ALTERNANCE";
  // Interior offers often mention "durée indéterminée" too, so check INTERIM first.
  if (n.includes("INTERIM") || n.includes("INTERIMAIRE")) return "INTERIM";
  if (n.includes("FREELANCE") || n.includes("INDEPENDANT") || n.includes("COLLABORATION")) {
    return "FREELANCE";
  }
  if (n === "CDI" || n.includes("DUREE INDETERMINEE") || n.includes("INDETERMINEE")) {
    return "CDI";
  }
  if (n === "CDD" || n.includes("DUREE DETERMINEE") || n.includes("DETERMINEE")) {
    return "CDD";
  }
  if (n === "VIE" || n.includes("VOLONTARIAT")) return "VIE";
  if (n.includes("CONTRAT PRO") || n.includes("PROFESSIONNALISATION")) return "CONTRAT_PRO";

  return "AUTRE";
}
