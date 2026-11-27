import { normalizeContractType } from "@/lib/contractType";
import { appendForemTrackingParam } from "@/lib/forem";
import type { Job } from "@/types/job";
import type { OdwbOfferRecord } from "./odwbRecord";
import { normalizeSearchText } from "./text";

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
  /** Work regime as published ("Temps plein", …), used as a filter key. */
  regime: string | null;
  /** Lower-cased sector and language labels, used as filter keys. */
  sectors: string[];
  languages: string[];
  latitude: number | null;
  longitude: number | null;
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
  // "Belgique", "Province du Hainaut", "RÉGION WALLONNE" — join so region and
  // province filters can both match on the column.
  const regions = asStringList(record.lieuxtravailregion);
  const region = regions.length > 0 ? regions.join(", ") : null;
  const metier = asTrimmedString(record.metier);
  const contractTypeRaw = asTrimmedString(record.typecontrat);
  const regime = asTrimmedString(record.regimetravail);
  const sectors = asStringList(record.secteurs).map((entry) => normalizeSearchText(entry));
  const languages = asStringList(record.langues).map((entry) => normalizeSearchText(entry));

  // The dataset carries one geo entry per workplace; the first is the reference
  // point for distance sorting.
  const geo = (record.lieuxtravailgeo ?? []).find(
    (entry) => typeof entry?.lat === "number" && typeof entry?.lon === "number"
  );
  const latitude = typeof geo?.lat === "number" ? geo.lat : null;
  const longitude = typeof geo?.lon === "number" ? geo.lon : null;

  const locationLabel = localities.length > 0 ? localities.join(", ") : FALLBACK_LOCATION;
  const url = appendForemTrackingParam(
    asTrimmedString(record.url) ||
      `https://www.leforem.be/recherche-offres/offre-detail/${rawId ?? ""}`
  );

  const offerId = rawId ?? buildStableOfferId({ url, title, company, location: locationLabel });

  // Accent- and case-insensitive, like the ODS `search()` it replaces.
  const searchText = normalizeSearchText(
    [title, company ?? "", metier ?? "", contractTypeRaw ?? "", region ?? "", ...localities, locationLabel].join(" ")
  );

  return {
    offerId,
    title,
    company,
    contractType: normalizeContractType(contractTypeRaw),
    contractTypeRaw,
    region,
    localities: localities.map((entry) => normalizeSearchText(entry)),
    postalCodes,
    locationLabel,
    regime,
    sectors,
    languages,
    latitude,
    longitude,
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
  contractTypeRaw?: string | null;
  locationLabel: string;
  publicationDate: Date | null;
  url: string;
  metier: string | null;
  distanceKm?: number | null;
}): Job {
  return {
    id: row.offerId,
    title: row.title,
    company: row.company ?? undefined,
    location: row.locationLabel || FALLBACK_LOCATION,
    contractType: row.contractType,
    contractTypeRaw: row.contractTypeRaw ?? undefined,
    publicationDate: (row.publicationDate ?? new Date()).toISOString(),
    url: row.url,
    description: row.metier ?? "",
    distanceKm: row.distanceKm === null || row.distanceKm === undefined ? undefined : row.distanceKm,
    source: "forem",
    pdfUrl: undefined,
  };
}
