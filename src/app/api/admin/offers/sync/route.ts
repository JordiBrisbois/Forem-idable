import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { runOffersSync } from "@/lib/server/offers/sync";

export const dynamic = "force-dynamic";

/**
 * Forces a mirror refresh instead of waiting for the daily slot.
 *
 * Admin-only: a sync spends one call of the shared ODWB quota, so it can be
 * triggered deliberately after an upstream recovery but not by anonymous traffic.
 */
export const POST = withSessionHandler(
  { access: "admin", fallbackMessage: "Impossible de lancer la synchronisation." },
  async () => {
    try {
      const result = await runOffersSync();
      return NextResponse.json({ ok: true, ...result });
    } catch (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error instanceof Error ? error.message : "unknown",
        },
        { status: 502 }
      );
    }
  }
);
