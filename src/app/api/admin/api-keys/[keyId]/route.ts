import { NextRequest, NextResponse } from "next/server";
import { recordAuditEvent } from "@/lib/server/auditLog";
import { markCoachAction, requireAdminAccess } from "@/lib/server/coach";
import { revokeApiKeyById } from "@/lib/server/apiKeys";
import { logServerEvent } from "@/lib/server/observability";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { parseIntegerParam } from "@/lib/server/requestSchemas";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ keyId: string }> }
) {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const admin = await requireAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { keyId: rawKeyId } = await context.params;
    const keyId = parseIntegerParam(rawKeyId);
    if (!keyId) {
      return NextResponse.json({ error: "Clé invalide." }, { status: 400 });
    }

    await revokeApiKeyById(keyId);
    await markCoachAction(admin.id);
    await recordAuditEvent({
      actorUserId: admin.id,
      action: "api_key_revoked",
      payload: {
        apiKeyId: keyId,
        scope: "global_admin",
      },
    });
    logServerEvent({
      category: "admin",
      action: "api_key_revoked",
      meta: {
        actorUserId: admin.id,
        apiKeyId: keyId,
        scope: "global_admin",
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Révocation impossible." }, { status: 500 });
  }
}
