import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/server/rateLimit";

type LocationCategory =
  | "Pays"
  | "Régions"
  | "Provinces"
  | "Arrondissements"
  | "Communes"
  | "Localités";

interface LocationEntry {
  id: string;
  name: string;
  type: LocationCategory;
  code?: string;
  level?: number;
  postalCode?: string;
}

interface ForemLocationRaw {
  serviceOrigin?: string;
  libelle?: string;
  code?: string;
  gufid?: string;
  niveauDecoupage?: number;
  codePostal?: string;
  codeNuts?: string;
}

const FOREM_NOMENCLATURE_URL =
  "https://www.leforem.be/recherche-offres/api/Nomenclature/Localisations";
const ODWB_RECORDS_URL =
  "https://www.odwb.be/api/explore/v2.1/catalog/datasets/offres-d-emploi-forem/records?select=lieuxtravailregion,lieuxtravaillocalite,lieuxtravailcodepostal&limit=5000";
const SERVER_CACHE_TTL_MS = 60 * 60 * 1000;

let serverCache: { ts: number; entries: LocationEntry[]; source: string } | null = null;

function mapLevelToCategory(level: number): LocationCategory | null {
  switch (level) {
    case 0:
      return "Pays";
    case 1:
      return "Régions";
    case 2:
      return "Provinces";
    case 3:
      return "Arrondissements";
    case 4:
      return "Communes";
    case 5:
      return "Localités";
    default:
      return null;
  }
}

function normalizeName(item: ForemLocationRaw): string | null {
  const rawName = item.libelle?.trim();
  if (!rawName) return null;

  const level = item.niveauDecoupage ?? -1;
  if (level === 5 && item.codePostal?.trim()) {
    return `${item.codePostal.trim()} ${rawName}`;
  }
  return rawName;
}

function isBelgianLocation(item: ForemLocationRaw): boolean {
  const origin = item.serviceOrigin ?? "";
  const nuts = item.codeNuts ?? "";
  const label = item.libelle?.toUpperCase() ?? "";
  const level = item.niveauDecoupage ?? -1;

  if (origin.includes("Belge")) return true;
  if (nuts.startsWith("BE")) return true;
  if (label === "BELGIQUE") return true;
  // Keep top-level nodes for hierarchy consistency
  if (level >= 0 && level <= 1) return true;
  return false;
}

function dedupeAndSort(entries: LocationEntry[]): LocationEntry[] {
  const seen = new Set<string>();
  const unique: LocationEntry[] = [];

  for (const entry of entries) {
    const key = `${entry.type}::${entry.name.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(entry);
  }

  const order: Record<LocationCategory, number> = {
    Pays: 0,
    Régions: 1,
    Provinces: 2,
    Arrondissements: 3,
    Communes: 4,
    Localités: 5,
  };

  unique.sort((a, b) => {
    const orderDiff = order[a.type] - order[b.type];
    if (orderDiff !== 0) return orderDiff;
    return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
  });

  return unique;
}

function mapForemNomenclature(raw: ForemLocationRaw[]): LocationEntry[] {
  const mapped: LocationEntry[] = [];

  for (const item of raw) {
    if (!isBelgianLocation(item)) continue;

    const level = item.niveauDecoupage ?? -1;
    const type = mapLevelToCategory(level);
    if (!type) continue;

    const name = normalizeName(item);
    if (!name) continue;

    const id = item.gufid || item.code || `${type}-${name}`;
    mapped.push({
      id,
      name,
      type,
      code: item.code,
      level,
      postalCode: item.codePostal?.trim() || undefined,
    });
  }

  return dedupeAndSort(mapped);
}

interface OdwbRecord {
  lieuxtravailregion?: string[];
  lieuxtravaillocalite?: string[];
  lieuxtravailcodepostal?: string[];
}

interface OdwbResponse {
  results?: OdwbRecord[];
}

function mapOdwbFallback(data: OdwbResponse): LocationEntry[] {
  const entries: LocationEntry[] = [];
  const results = Array.isArray(data?.results) ? data.results : [];

  for (const record of results) {
    const regions: string[] = Array.isArray(record?.lieuxtravailregion)
      ? record.lieuxtravailregion
      : [];
    const localites: string[] = Array.isArray(record?.lieuxtravaillocalite)
      ? record.lieuxtravaillocalite
      : [];
    const postaux: string[] = Array.isArray(record?.lieuxtravailcodepostal)
      ? record.lieuxtravailcodepostal
      : [];

    for (const region of regions) {
      const value = String(region || "").trim();
      if (!value) continue;

      if (value === "Belgique") {
        entries.push({ id: "be", name: "Belgique", type: "Pays" });
      } else if (value.startsWith("RÉGION")) {
        entries.push({ id: `reg-${value}`, name: value, type: "Régions" });
      } else if (value.startsWith("Province")) {
        entries.push({ id: `prov-${value}`, name: value, type: "Provinces" });
      }
    }

    localites.forEach((localite, idx) => {
      const name = String(localite || "").trim();
      if (!name) return;
      const cp = String(postaux[idx] || "").trim();
      entries.push({
        id: `loc-${cp}-${name}`,
        name: cp ? `${cp} ${name}` : name,
        type: "Localités",
        code: undefined,
        level: 5,
        postalCode: cp || undefined,
      });
    });
  }

  return dedupeAndSort(entries);
}

export async function GET(request: NextRequest) {
  try {
    const rateLimit = await checkRateLimit({
      scope: "locations",
      limit: 30,
      windowMs: 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez dans quelques instants." },
        { status: 429 }
      );
    }

    const url = request.nextUrl;
    const limitParam = Math.min(Math.max(Number(url.searchParams.get("limit")) || 200, 1), 200);
    const offsetParam = Math.max(Number(url.searchParams.get("offset")) || 0, 0);

    if (serverCache && Date.now() - serverCache.ts < SERVER_CACHE_TTL_MS) {
      const total = serverCache.entries.length;
      const paginated = serverCache.entries.slice(offsetParam, offsetParam + limitParam);
      return NextResponse.json({
        entries: paginated,
        total,
        source: `${serverCache.source}-memory-cache`,
      });
    }

    // Preferred source: Forem nomenclature hierarchy
    const foremResponse = await fetch(FOREM_NOMENCLATURE_URL, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 * 60 * 24 },
    });

    if (foremResponse.ok) {
      const raw = (await foremResponse.json()) as ForemLocationRaw[];
      const entries = mapForemNomenclature(raw);
      if (entries.length > 0) {
        serverCache = { ts: Date.now(), entries, source: "forem-nomenclature" };
        const total = entries.length;
        const paginated = entries.slice(offsetParam, offsetParam + limitParam);
        return NextResponse.json({ entries: paginated, total, source: "forem-nomenclature" });
      }
    }

    // Fallback source: ODWB offers snapshot
    const odwbResponse = await fetch(ODWB_RECORDS_URL, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 * 60 * 12 },
    });

    if (odwbResponse.ok) {
      const data = await odwbResponse.json();
      const entries = mapOdwbFallback(data);
      const total = entries.length;
      if (entries.length > 0) {
        serverCache = { ts: Date.now(), entries, source: "odwb-fallback" };
      }
      const paginated = entries.slice(offsetParam, offsetParam + limitParam);
      return NextResponse.json({ entries: paginated, total, source: "odwb-fallback" });
    }

    return NextResponse.json({ entries: [], total: 0, source: "none" }, { status: 502 });
  } catch (error) {
    console.error("Locations API error:", error);
    return NextResponse.json({ entries: [], total: 0, source: "error" }, { status: 500 });
  }
}
