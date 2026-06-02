import { db } from "@/lib/server/db";

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface CachedCompany {
  osmId: number;
  name: string;
  type: string;
  email: string | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  lat: string | null;
  lon: string | null;
  town: string | null;
  emailSource: string;
  allEmails: string[];
  scrapedAt: Date | null;
}

function safeJson(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

function parseRow(row: Record<string, unknown>): CachedCompany {
  return {
    osmId: Number(row.osm_id),
    name: String(row.name),
    type: String(row.type ?? "?"),
    email: row.email ? String(row.email) : null,
    website: row.website ? String(row.website) : null,
    phone: row.phone ? String(row.phone) : null,
    address: row.address ? String(row.address) : null,
    lat: row.lat ? String(row.lat) : null,
    lon: row.lon ? String(row.lon) : null,
    town: row.town ? String(row.town) : null,
    emailSource: String(row.email_source ?? ""),
    allEmails: (safeJson(row.all_emails) as string[]) ?? [],
    scrapedAt: row.scraped_at ? new Date(String(row.scraped_at)) : null,
  };
}

export async function getCachedCompany(osmId: number): Promise<CachedCompany | null> {
  const result = await db.query<Record<string, unknown>>(
    `SELECT * FROM company_cache WHERE osm_id = $1`,
    [osmId]
  );
  if (result.rows.length === 0) return null;

  const row = parseRow(result.rows[0]);
  if (!row.scrapedAt || Date.now() - row.scrapedAt.getTime() > CACHE_TTL_MS) {
    return null;
  }
  return row;
}

export async function getCachedCompanyByWebsite(website: string): Promise<CachedCompany | null> {
  const normalized = website.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
  const result = await db.query<Record<string, unknown>>(
    `SELECT * FROM company_cache WHERE LOWER(REPLACE(REPLACE(website, 'https://', ''), 'http://', '')) = $1`,
    [normalized]
  );
  if (result.rows.length === 0) return null;

  const row = parseRow(result.rows[0]);
  if (!row.scrapedAt || Date.now() - row.scrapedAt.getTime() > CACHE_TTL_MS) {
    return null;
  }
  return row;
}

export async function upsertCachedCompany(data: {
  osmId: number;
  name: string;
  type?: string;
  email?: string | null;
  website?: string | null;
  phone?: string | null;
  address?: string | null;
  lat?: string | null;
  lon?: string | null;
  town?: string | null;
  emailSource?: string;
  allEmails?: string[];
  scrapedAt?: Date;
}): Promise<void> {
  await db.query(
    `INSERT INTO company_cache (
      osm_id, name, type, email, website, phone, address, lat, lon, town,
      email_source, all_emails, scraped_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13, NOW())
    ON CONFLICT (osm_id) DO UPDATE SET
      name = EXCLUDED.name,
      type = EXCLUDED.type,
      email = EXCLUDED.email,
      website = EXCLUDED.website,
      phone = EXCLUDED.phone,
      address = EXCLUDED.address,
      lat = EXCLUDED.lat,
      lon = EXCLUDED.lon,
      town = EXCLUDED.town,
      email_source = EXCLUDED.email_source,
      all_emails = EXCLUDED.all_emails,
      scraped_at = EXCLUDED.scraped_at,
      updated_at = NOW()`,
    [
      data.osmId,
      data.name,
      data.type ?? "?",
      data.email ?? null,
      data.website ?? null,
      data.phone ?? null,
      data.address ?? null,
      data.lat ?? null,
      data.lon ?? null,
      data.town ?? null,
      data.emailSource ?? "",
      JSON.stringify(data.allEmails ?? []),
      data.scrapedAt ?? new Date(),
    ]
  );
}

export async function cacheScoutResult(
  result: {
    osmId: number | null;
    name: string;
    type?: string;
    email?: string | null;
    website?: string | null;
    phone?: string | null;
    address?: string | null;
    lat?: string | null;
    lon?: string | null;
    town?: string | null;
    emailSource?: string;
    allEmails?: string[];
  },
  scrapedAt?: Date
): Promise<void> {
  if (!result.osmId) return;
  await upsertCachedCompany({
    osmId: result.osmId,
    name: result.name,
    type: result.type,
    email: result.email,
    website: result.website,
    phone: result.phone,
    address: result.address,
    lat: result.lat,
    lon: result.lon,
    town: result.town,
    emailSource: result.emailSource,
    allEmails: result.allEmails,
    scrapedAt: scrapedAt ?? new Date(),
  });
}
