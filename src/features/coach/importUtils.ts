import { JobApplication } from "@/types/application";

export const COACH_IMPORT_FIELDS = [
  { key: "company", label: "Entreprise", required: true },
  { key: "contractType", label: "Type de contrat", required: false },
  { key: "title", label: "Intitulé de poste", required: true },
  { key: "location", label: "Lieu", required: false },
  { key: "appliedAt", label: "Date d'envoi", required: false },
  { key: "status", label: "Statut", required: false },
  { key: "notes", label: "Note", required: false },
] as const;

export type CoachImportFieldKey = (typeof COACH_IMPORT_FIELDS)[number]["key"];

const COACH_IMPORT_FIELD_PATTERNS: Record<CoachImportFieldKey, string[]> = {
  company: ["entreprise", "societe", "société"],
  contractType: ["contrat", "type de contrat", "type contrat"],
  title: ["intitule poste", "intituler poste", "poste", "fonction", "intitule"],
  location: ["lieu", "ville", "localisation"],
  appliedAt: ["date envoi", "date envois", "date candidature", "date"],
  status: ["statut", "status"],
  notes: ["note", "remarque", "commentaire"],
};

export function normalizeCoachImportHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function detectCoachImportFieldMapping(headers: string[]) {
  const normalizedHeaders = headers.map((header) => ({
    original: header,
    normalized: normalizeCoachImportHeader(header),
  }));

  const headerFor = (patterns: string[]) =>
    normalizedHeaders.find((header) =>
      patterns.some((pattern) => header.normalized.includes(normalizeCoachImportHeader(pattern)))
    )?.original ?? "";

  return {
    company: headerFor(COACH_IMPORT_FIELD_PATTERNS.company),
    contractType: headerFor(COACH_IMPORT_FIELD_PATTERNS.contractType),
    title: headerFor(COACH_IMPORT_FIELD_PATTERNS.title),
    location: headerFor(COACH_IMPORT_FIELD_PATTERNS.location),
    appliedAt: headerFor(COACH_IMPORT_FIELD_PATTERNS.appliedAt),
    status: headerFor(COACH_IMPORT_FIELD_PATTERNS.status),
    notes: headerFor(COACH_IMPORT_FIELD_PATTERNS.notes),
  } satisfies Record<CoachImportFieldKey, string>;
}

export function normalizeCoachImportedStatus(value?: string): JobApplication["status"] | undefined;
export function normalizeCoachImportedStatus(value: string | undefined, fallback: ""): JobApplication["status"] | "";
export function normalizeCoachImportedStatus(
  value: string | undefined,
  fallback: JobApplication["status"]
): JobApplication["status"];
export function normalizeCoachImportedStatus(
  value?: string,
  fallback?: JobApplication["status"] | ""
) {
  const normalized = value?.trim().toLowerCase();

  switch (normalized) {
    case "in_progress":
    case "en cours":
    case "encours":
    case "in progress":
      return "in_progress" as const;
    case "follow_up":
    case "relance":
    case "a relancer":
    case "à relancer":
    case "suivi":
      return "follow_up" as const;
    case "interview":
    case "entretien":
      return "interview" as const;
    case "rejected":
    case "refuse":
    case "refusé":
    case "refusee":
    case "refusée":
    case "rejetee":
    case "rejetée":
      return "rejected" as const;
    case "accepted":
    case "accepte":
    case "accepté":
    case "acceptee":
    case "acceptée":
      return "accepted" as const;
    default:
      return fallback;
  }
}
