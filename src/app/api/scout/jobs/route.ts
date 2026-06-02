import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { db, ensureDatabase } from "@/lib/server/db";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { geocodeTown } from "@/lib/server/scoutNominatim";
import { SCOUT_CATEGORIES } from "@/lib/server/scoutOverpass";
import { logServerEvent } from "@/lib/server/observability";
import { checkRateLimit } from "@/lib/server/rateLimit";
import { z } from "zod";

const createJobSchema = z.object({
  query: z.string().min(1).max(200),
  radius: z.number().int().min(500).max(20000).default(5000),
  categories: z.array(z.string()).max(50).optional(),
  scrapeEmails: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const forbidden = rejectCrossOriginRequest(request);
  if (forbidden) return forbidden;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureDatabase();
    const body = await request.json();
    const parsed = createJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }

    const { query, radius, categories, scrapeEmails } = parsed.data;

    // Rate limit: 5 jobs per hour per user
    const hourlyLimit = await checkRateLimit({
      scope: "scout-jobs-hourly",
      limit: 5,
      windowMs: 60 * 60 * 1000,
      identifier: String(user.id),
    });
    if (!hourlyLimit.allowed) {
      return NextResponse.json(
        { error: "Limite atteinte : max 5 recherches par heure." },
        { status: 429 }
      );
    }

    // Rate limit scraping: 1 scrape job per 10 minutes per user
    if (scrapeEmails) {
      const scrapeLimit = await checkRateLimit({
        scope: "scout-scrape",
        limit: 1,
        windowMs: 10 * 60 * 1000,
        identifier: String(user.id),
      });
      if (!scrapeLimit.allowed) {
        return NextResponse.json(
          { error: "Limite scraping : max 1 recherche avec scraping toutes les 10 min." },
          { status: 429 }
        );
      }
    }

    // Max 2 active jobs per user (queued or running)
    const runningUser = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM scout_jobs WHERE user_id = $1 AND status IN ('queued', 'running')`,
      [user.id]
    );
    if (Number(runningUser.rows[0].count) >= 2) {
      return NextResponse.json(
        { error: "Vous avez déjà 2 recherches en cours. Attendez qu'elles terminent." },
        { status: 429 }
      );
    }

    // Global max 3 active jobs (queued or running)
    const runningGlobal = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM scout_jobs WHERE status IN ('queued', 'running')`
    );
    if (Number(runningGlobal.rows[0].count) >= 3) {
      return NextResponse.json(
        { error: "Le serveur est occupé (3 recherches en cours). Réessayez dans quelques minutes." },
        { status: 429 }
      );
    }

    const geo = await geocodeTown(query);
    if (!geo) {
      return NextResponse.json({ error: "Ville introuvable." }, { status: 400 });
    }

    const cats = categories && categories.length > 0 ? categories : Object.keys(SCOUT_CATEGORIES);

    const result = await db.query<{ id: number }>(
      `INSERT INTO scout_jobs (user_id, status, query, lat, lon, radius, categories, scrape_emails, total_steps)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)
       RETURNING id`,
      [
        user.id,
        "queued",
        geo.display_name,
        geo.lat,
        geo.lon,
        radius,
        JSON.stringify(cats),
        scrapeEmails ?? false,
        Math.ceil(cats.length / 3),
      ]
    );

    const jobId = result.rows[0].id;

    return NextResponse.json({ jobId }, { status: 201 });
  } catch (error) {
    logServerEvent({
      category: "scout",
      action: "create_job_failed",
      level: "error",
      meta: { error: error instanceof Error ? error.message : "unknown" },
    });
    return NextResponse.json({ error: "Création impossible." }, { status: 500 });
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureDatabase();
    const result = await db.query<{
      id: number;
      status: string;
      query: string;
      radius: number;
      total_steps: number;
      completed_steps: number;
      result_count: number;
      scrape_emails: boolean;
      created_at: string;
      completed_at: string | null;
    }>(
      `SELECT id, status, query, radius, total_steps, completed_steps, result_count, scrape_emails, created_at, completed_at
       FROM scout_jobs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [user.id]
    );

    return NextResponse.json({ jobs: result.rows });
  } catch (error) {
    logServerEvent({
      category: "scout",
      action: "list_jobs_failed",
      level: "error",
      meta: { error: error instanceof Error ? error.message : "unknown" },
    });
    return NextResponse.json({ error: "Chargement impossible." }, { status: 500 });
  }
}
