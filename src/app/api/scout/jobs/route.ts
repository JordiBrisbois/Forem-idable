import { NextResponse } from "next/server";
import { z } from "zod";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { db, ensureDatabase } from "@/lib/server/db";
import { checkRateLimit } from "@/lib/server/rateLimit";
import { geocodeTown } from "@/lib/server/scoutNominatim";
import { SCOUT_CATEGORIES } from "@/lib/server/scoutOverpass";

const createJobSchema = z.object({
  query: z.string().min(1).max(200),
  radius: z.number().int().min(500).max(20000).default(5000),
  categories: z.array(z.string()).max(50).optional(),
  scrapeEmails: z.boolean().optional(),
});

export const POST = withSessionHandler(
  {
    access: "user",
    body: createJobSchema,
    bodyErrorMessage: "Requête invalide.",
    fallbackMessage: "Création impossible.",
  },
  async ({ user, body }) => {
    await ensureDatabase();
    const { query, radius, categories, scrapeEmails } = body;

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

    return NextResponse.json({ jobId: result.rows[0].id }, { status: 201 });
  }
);

export const GET = withSessionHandler(
  { access: "user", fallbackMessage: "Chargement impossible." },
  async ({ user }) => {
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
  }
);
