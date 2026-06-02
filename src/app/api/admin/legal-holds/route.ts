import { NextRequest, NextResponse } from "next/server";
import { createLegalHold, listActiveLegalHolds } from "@/lib/server/compliance";
import { requireAdminAccess } from "@/lib/server/coach";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { legalHoldCreateSchema, readValidatedJson } from "@/lib/server/requestSchemas";

export async function GET() {
  try {
    const admin = await requireAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const holds = await listActiveLegalHolds();
    return NextResponse.json({ holds });
  } catch {
    return NextResponse.json({ error: "Legal holds indisponibles." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const admin = await requireAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = await readValidatedJson(request, legalHoldCreateSchema);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const hold = await createLegalHold({
      actorUserId: admin.id,
      ...parsed.data,
    });
    return NextResponse.json({ hold }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Création du legal hold impossible." }, { status: 500 });
  }
}
