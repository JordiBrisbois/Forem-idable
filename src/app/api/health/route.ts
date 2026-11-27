import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

/**
 * Liveness + database readiness.
 *
 * The Docker healthcheck used to hit `/`, which renders fine with the database
 * down — so a restart of the Postgres container (new IP, stale resolution in this
 * container) left the app "healthy" while every data route returned 503, for 18
 * hours. Probing the pool makes the orchestrator restart the container instead.
 */
export async function GET() {
  try {
    await db.query("SELECT 1");
    return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json(
      { ok: false, error: "database_unavailable" },
      { status: 503, headers: { "cache-control": "no-store" } }
    );
  }
}
