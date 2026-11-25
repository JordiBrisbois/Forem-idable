import { normalizeContractType } from "@/lib/contractType";
import { appendForemTrackingParam } from "@/lib/forem";
import type { Job } from "@/types/job";
import type { OdwbOfferRecord } from "./odwbRecord";

/** A row ready for `forem_offers`, derived from one ODWB record. */
export interface NormalizedOffer {
  offerId: string;
  title: string;
  company: string | null;
  contractType: string;
  contractTypeRaw: string | null;
  region: string | null;
  localities: string[];
  postalCodes: string[];
  /** Display form of the localities ("Namur, Beez"), unlike the lower-cased keys. */
  locationLabel: string;
  metier: string | null;
  publicationDate: Date | null;
  url: string;
  searchText: string;
  payload: OdwbOfferRecord;
}

const FALLBACK_TITLE = "Poste non spécifié";
const FALLBACK_LOCATION = "Wallonie";

function asTrimmedString(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    const single = asTrimmedString(value);
    return single ? [single] : [];
  }

  return value
    .map((entry) => asTrimmedString(entry))
    .filter((entry): entry is string => entry !== null);
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * ODWB ids are numeric strings; records with no `numerooffreforem` still need a
 * stable identity so re-syncing updates the row instead of duplicating it.
 */
export function buildStableOfferId(parts: {
  url: string;
  title: string;
  company?: string | null;
  location: string;
}): string {
  const signature = [
    parts.url.trim().toLowerCase(),
    parts.title.trim().toLowerCase(),
    (parts.company ?? "").trim().toLowerCase(),
    parts.location.trim().toLowerCase(),
  ].join("|");

  let hash = 5381;
  for (let index = 0; index < signature.length; index += 1) {
    hash = ((hash << 5) + hash) ^ signature.charCodeAt(index);
  }

  return `forem-fallback-${Math.abs(hash >>> 0).toString(36)}`;
}

export function normalizeOffer(record: OdwbOfferRecord): NormalizedOffer {
  const rawId = asTrimmedString(record.numerooffreforem);
  const title = asTrimmedString(record.titreoffre) ?? FALLBACK_TITLE;
  const company = asTrimmedString(record.nomemployeur);
  const localities = asStringList(record.lieuxtravaillocalite);
  const postalCodes = asStringList(record.lieuxtravailcodepostal);
  const region = asTrimmedString(record.lieuxtravailregion);
  const metier = asTrimmedString(record.metier);
  const contractTypeRaw = asTrimmedString(record.typecontrat);

  const locationLabel = localities.length > 0 ? localities.join(", ") : FALLBACK_LOCATION;
  const url = appendForemTrackingParam(
    asTrimmedString(record.url) ||
      `https://www.leforem.be/recherche-offres/offre-detail/${rawId ?? ""}`
  );

  const offerId = rawId ?? buildStableOfferId({ url, title, company, location: locationLabel });

  const searchText = [
    title,
    company ?? "",
    metier ?? "",
    contractTypeRaw ?? "",
    region ?? "",
    ...localities,
    locationLabel,
  ]
    .join(" ")
    .toLowerCase();

  return {
    offerId,
    title,
    company,
    contractType: normalizeContractType(contractTypeRaw),
    contractTypeRaw,
    region,
    localities: localities.map((entry) => entry.toLowerCase()),
    postalCodes,
    locationLabel,
    metier,
    publicationDate: toDate(record.datedebutdiffusion),
    url,
    searchText,
    payload: record,
  };
}

/** Search result projection: the shape the client already consumes. */
export function toJob(row: {
  offerId: string;
  title: string;
  company: string | null;
  contractType: string;
  locationLabel: string;
  publicationDate: Date | null;
  url: string;
  metier: string | null;
}): Job {
  return {
    id: row.offerId,
    title: row.title,
    company: row.company ?? undefined,
    location: row.locationLabel || FALLBACK_LOCATION,
    contractType: row.contractType,
    publicationDate: (row.publicationDate ?? new Date()).toISOString(),
    url: row.url,
    description: row.metier ?? "",
    source: "forem",
    pdfUrl: undefined,
  };
}
