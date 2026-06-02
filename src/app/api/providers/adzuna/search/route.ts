import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Job } from "@/types/job";
import { ForemSearchParams } from "@/services/api/foremClient";
import { LocationEntry } from "@/services/location/locationCache";
import { serverConfig } from "@/config/runtime.server";
import { checkRateLimit } from "@/lib/server/rateLimit";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";

const ADZUNA_BASE_URL = "https://api.adzuna.com/v1/api/jobs";
const ADZUNA_RESULTS_PER_PAGE = 50;
const ADZUNA_MAX_RESULTS_WINDOW = 150;

const locationEntrySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    type: z.enum(["Pays", "Régions", "Provinces", "Arrondissements", "Communes", "Localités"]),
    parentId: z.string().optional(),
    code: z.string().optional(),
    level: z.number().optional(),
    postalCode: z.string().optional(),
  })
  .strict();

const providerSearchParamsSchema = z
  .object({
    keywords: z.array(z.string()).optional(),
    locations: z.array(locationEntrySchema).optional(),
    limit: z.number().min(1).optional().default(50),
    offset: z.number().min(0).optional().default(0),
    booleanMode: z.enum(["AND", "OR"]).optional(),
  })
  .strict();

const adzunaResultSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    created: z.string().optional(),
    redirect_url: z.string().optional(),
    company: z.object({ display_name: z.string().optional() }).optional(),
    location: z
      .object({
        display_name: z.string().optional(),
        area: z.array(z.string()).optional(),
      })
      .optional(),
    contract_type: z.string().optional(),
    contract_time: z.string().optional(),
    category: z.object({ label: z.string().optional() }).optional(),
  })
  .passthrough();

const adzunaApiResponseSchema = z
  .object({
    count: z.number().optional(),
    results: z.array(adzunaResultSchema).default([]),
  })
  .passthrough();

function sanitizeLocationName(entry: LocationEntry): string {
  const raw = entry.name.trim();
  const noPostal = raw.replace(/^\d{4}\s+/, "");

  if (entry.type === "Arrondissements") {
    return noPostal.replace(/^Arrondissement\s+d[eu]?\s+/i, "").trim();
  }
  if (entry.type === "Provinces") {
    return noPostal.replace(/^Province\s+d[eu]?\s+/i, "").trim();
  }
  if (entry.type === "Régions") {
    if (/bruxelles/i.test(noPostal)) return "Brussels";
    if (/flandre/i.test(noPostal)) return "Flanders";
    if (/wallonie/i.test(noPostal)) return "Wallonia";
  }
  return noPostal;
}

function buildLocationQueries(locations?: LocationEntry[]): string[] {
  if (!locations || locations.length === 0) return [];
  const unique = new Set<string>();
  for (const entry of locations) {
    const value = sanitizeLocationName(entry);
    if (value) unique.add(value);
  }
  // Protect free-tier quota: max 5 location calls per search.
  return Array.from(unique).slice(0, 5);
}

function normalizeContract(result: z.infer<typeof adzunaResultSchema>): string {
  const parts = [result.contract_type, result.contract_time].filter(
    (value): value is string => Boolean(value)
  );
  if (parts.length > 0) return parts.join(" · ");
  return result.category?.label || "Non spécifié";
}

function mapAdzunaResultToJob(result: z.infer<typeof adzunaResultSchema>): Job | null {
  const url = result.redirect_url?.trim();
  const title = result.title?.trim();
  if (!url || !title) return null;

  const area = Array.isArray(result.location?.area) ? result.location?.area : [];
  const location = result.location?.display_name || area?.join(", ") || "Belgique";

  return {
    id: `adzuna-${String(result.id || url)}`,
    title,
    company: result.company?.display_name,
    location,
    contractType: normalizeContract(result),
    publicationDate: result.created || new Date().toISOString(),
    url,
    description: result.description || "",
    source: "adzuna",
    pdfUrl: undefined,
  };
}

function dedupeJobs(jobs: Job[]): Job[] {
  const seen = new Set<string>();
  const unique: Job[] = [];

  for (const job of jobs) {
    const key = [
      job.url.toLowerCase(),
      (job.title || "").toLowerCase(),
      (job.company || "").toLowerCase(),
      (job.location || "").toLowerCase(),
    ].join("|");

    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(job);
  }
  return unique;
}

function sortJobsByPublicationDate(jobs: Job[]): Job[] {
  return [...jobs].sort((a, b) => {
    const aDate = Date.parse(a.publicationDate || "");
    const bDate = Date.parse(b.publicationDate || "");
    const safeA = Number.isFinite(aDate) ? aDate : 0;
    const safeB = Number.isFinite(bDate) ? bDate : 0;
    return safeB - safeA;
  });
}

async function fetchAdzunaPage(options: {
  appId: string;
  appKey: string;
  where?: string;
  keywords?: string[];
  page: number;
}): Promise<z.infer<typeof adzunaApiResponseSchema>> {
  const searchUrl = new URL(
    `${ADZUNA_BASE_URL}/${serverConfig.adzuna.country}/search/${options.page}`
  );
  searchUrl.searchParams.set("app_id", options.appId);
  searchUrl.searchParams.set("app_key", options.appKey);
  searchUrl.searchParams.set("results_per_page", String(ADZUNA_RESULTS_PER_PAGE));
  searchUrl.searchParams.set("content-type", "application/json");

  if (options.keywords && options.keywords.length > 0) {
    searchUrl.searchParams.set("what", options.keywords.join(" "));
  }

  if (options.where) {
    searchUrl.searchParams.set("where", options.where);
  }

  const response = await fetch(searchUrl.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    return { count: 0, results: [] };
  }

  const parsed = adzunaApiResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    console.error("Adzuna payload validation failed", parsed.error.flatten());
    return { count: 0, results: [] };
  }

  return parsed.data;
}

export async function POST(request: NextRequest) {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const rateLimit = await checkRateLimit({
      scope: "adzuna-search",
      limit: 10,
      windowMs: 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez dans quelques instants." },
        { status: 429 }
      );
    }

    const appId = serverConfig.adzuna.appId;
    const appKey = serverConfig.adzuna.appKey;

    if (!serverConfig.adzuna.enabled || !appId || !appKey) {
      return NextResponse.json({ jobs: [], total: 0, enabled: false });
    }

    const parsedBody = providerSearchParamsSchema.safeParse(
      (await request.json()) as ForemSearchParams
    );
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Paramètres de recherche invalides." }, { status: 400 });
    }

    const body = parsedBody.data;
    const keywords = body.keywords ?? [];
    const locations: LocationEntry[] = body.locations ?? [];
    const effectiveOffset = Math.min(body.offset, ADZUNA_MAX_RESULTS_WINDOW);
    const effectiveLimit = Math.min(body.limit, ADZUNA_MAX_RESULTS_WINDOW);
    const windowEndExclusive = Math.min(
      effectiveOffset + effectiveLimit,
      ADZUNA_MAX_RESULTS_WINDOW
    );
    const firstPage = Math.floor(effectiveOffset / ADZUNA_RESULTS_PER_PAGE) + 1;
    const lastPage = Math.max(
      firstPage,
      Math.ceil(windowEndExclusive / ADZUNA_RESULTS_PER_PAGE)
    );
    const pages = Array.from(
      { length: lastPage - firstPage + 1 },
      (_, index) => firstPage + index
    );

    const locationQueries = buildLocationQueries(locations);
    const whereQueries = locationQueries.length > 0 ? locationQueries : [undefined];

    const responses = await Promise.all(
      whereQueries.flatMap((where) =>
        pages.map((page) =>
          fetchAdzunaPage({
            appId,
            appKey,
            where,
            keywords,
            page,
          })
        )
      )
    );

    const rawJobs = responses.flatMap((r) => (Array.isArray(r.results) ? r.results : []));
    const mapped = rawJobs
      .map(mapAdzunaResultToJob)
      .filter((job): job is Job => Boolean(job));

    const deduped = sortJobsByPublicationDate(dedupeJobs(mapped));
    const sliced = deduped.slice(effectiveOffset, windowEndExclusive);
    const total = deduped.length;

    return NextResponse.json({
      jobs: sliced,
      total,
      enabled: true,
    });
  } catch (error) {
    console.error("Adzuna provider error:", error);
    return NextResponse.json({ jobs: [], total: 0, enabled: true }, { status: 500 });
  }
}
