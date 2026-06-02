import { NextRequest, NextResponse } from "next/server";
import { releaseLegalHold } from "@/lib/server/compliance";
import { requireAdminAccess } from "@/lib/server/coach";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { parseIntegerParam } from "@/lib/server/requestSchemas";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const admin = await requireAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: rawId } = await context.params;
    const id = parseIntegerParam(rawId);
    if (!id) {
      return NextResponse.json({ error: "Legal hold invalide." }, { status: 400 });
    }

    const hold = await releaseLegalHold(id, admin.id);
    if (!hold) {
      return NextResponse.json({ error: "Legal hold introuvable." }, { status: 404 });
    }

    return NextResponse.json({ hold });
  } catch {
    return NextResponse.json({ error: "Libération impossible." }, { status: 500 });
  }
}
