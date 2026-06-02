import { NextRequest, NextResponse } from "next/server";
import { markCoachAction, requireAdminAccess } from "@/lib/server/coach";
import { revokeApiKey } from "@/lib/server/apiKeys";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { parseIntegerParam } from "@/lib/server/requestSchemas";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ userId: string; keyId: string }> }
) {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const admin = await requireAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId: rawUserId, keyId: rawKeyId } = await context.params;
    const userId = parseIntegerParam(rawUserId);
    const keyId = parseIntegerParam(rawKeyId);
    if (!userId || !keyId) {
      return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
    }

    await revokeApiKey(userId, keyId);
    await markCoachAction(admin.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Révocation impossible." }, { status: 500 });
  }
}
