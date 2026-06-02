import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { db, ensureDatabase } from "@/lib/server/db";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { logServerEvent } from "@/lib/server/observability";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId: rawJobId } = await context.params;
  const jobId = Number(rawJobId);
  if (!jobId) {
    return NextResponse.json({ error: "ID invalide." }, { status: 400 });
  }

  try {
    await ensureDatabase();
    const jobResult = await db.query<{
      id: number;
      status: string;
      query: string;
      lat: string;
      lon: string;
      radius: number;
      categories: string;
      scrape_emails: boolean;
      total_steps: number;
      completed_steps: number;
      result_count: number;
      error_message: string | null;
      created_at: string;
      completed_at: string | null;
      user_id: number;
    }>(
      `SELECT id, status, query, lat, lon, radius, categories, scrape_emails, total_steps, completed_steps, result_count, error_message, created_at, completed_at, user_id
       FROM scout_jobs
       WHERE id = $1`,
      [jobId]
    );

    const job = jobResult.rows[0];
    if (!job) {
      return NextResponse.json({ error: "Job introuvable." }, { status: 404 });
    }
    if (Number(job.user_id) !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resultsResult = await db.query<{
      id: number;
      name: string;
      type: string;
      email: string | null;
      website: string | null;
      phone: string | null;
      address: string | null;
      lat: string | null;
      lon: string | null;
      town: string | null;
      email_source: string;
      all_emails: string;
      osm_id: number | null;
    }>(
      `SELECT id, name, type, email, website, phone, address, lat, lon, town, email_source, all_emails, osm_id
       FROM scout_results
       WHERE job_id = $1
       ORDER BY name ASC`,
      [jobId]
    );

    function safeJson(value: unknown) {
      if (value === null || value === undefined) return value;
      if (typeof value === "string") {
        try { return JSON.parse(value); } catch { return value; }
      }
      return value;
    }

    return NextResponse.json({
      job: {
        ...job,
        categories: safeJson(job.categories),
      },
      results: resultsResult.rows.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        email: r.email,
        website: r.website,
        phone: r.phone,
        address: r.address,
        lat: r.lat,
        lon: r.lon,
        town: r.town,
        emailSource: r.email_source,
        allEmails: safeJson(r.all_emails),
        osmId: r.osm_id,
      })),
    });
  } catch (error) {
    logServerEvent({
      category: "scout",
      action: "get_job_failed",
      level: "error",
      meta: { error: error instanceof Error ? error.message : "unknown" },
    });
    return NextResponse.json({ error: "Chargement impossible." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  const forbidden = rejectCrossOriginRequest(_request);
  if (forbidden) return forbidden;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId: rawJobId } = await context.params;
  const jobId = Number(rawJobId);
  if (!jobId) {
    return NextResponse.json({ error: "ID invalide." }, { status: 400 });
  }

  try {
    await ensureDatabase();
    const check = await db.query<{ user_id: number }>(
      `SELECT user_id FROM scout_jobs WHERE id = $1`,
      [jobId]
    );
    if (check.rows.length === 0) {
      return NextResponse.json({ error: "Job introuvable." }, { status: 404 });
    }
    if (Number(check.rows[0].user_id) !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.query(`DELETE FROM scout_jobs WHERE id = $1`, [jobId]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    logServerEvent({
      category: "scout",
      action: "delete_job_failed",
      level: "error",
      meta: { error: error instanceof Error ? error.message : "unknown" },
    });
    return NextResponse.json({ error: "Suppression impossible." }, { status: 500 });
  }
}
