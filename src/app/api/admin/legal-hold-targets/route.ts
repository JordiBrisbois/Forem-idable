import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { listLegalHoldTargetOptions } from "@/lib/server/compliance";
import { legalHoldTargetLookupQuerySchema } from "@/lib/server/requestSchemas";

export const GET = withSessionHandler(
  { access: "admin", fallbackMessage: "Recherche de cibles indisponible." },
  async ({ request }) => {
    const parsed = legalHoldTargetLookupQuerySchema.safeParse({
      targetType: request.nextUrl.searchParams.get("targetType") ?? undefined,
      q: request.nextUrl.searchParams.get("q") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { error: issue?.message ?? "Recherche de cible invalide." },
        { status: 400 }
      );
    }

    const options = await listLegalHoldTargetOptions(parsed.data);
    return NextResponse.json({ options }, { headers: { "Cache-Control": "no-store" } });
  }
);
