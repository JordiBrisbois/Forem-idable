import { NextRequest, NextResponse } from "next/server";
import { listLegalHoldTargetOptions } from "@/lib/server/compliance";
import { requireAdminAccess } from "@/lib/server/coach";
import { legalHoldTargetLookupQuerySchema } from "@/lib/server/requestSchemas";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
    return NextResponse.json(
      { options },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch {
    return NextResponse.json({ error: "Recherche de cibles indisponible." }, { status: 500 });
  }
}
