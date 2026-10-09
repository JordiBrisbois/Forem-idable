import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { revokeApiKeyById } from "@/lib/server/apiKeys";
import { recordAuditEvent } from "@/lib/server/auditLog";
import { markCoachAction } from "@/lib/server/coach";
import { logServerEvent } from "@/lib/server/observability";
import { parseRouteId } from "@/lib/server/routeParams";

export const DELETE = withSessionHandler(
  { access: "admin", fallbackMessage: "Révocation impossible." },
  async ({ user, params }) => {
    const keyId = parseRouteId(params.keyId as string);
    if (!keyId) {
      return NextResponse.json({ error: "Clé invalide." }, { status: 400 });
    }

    await revokeApiKeyById(keyId);
    await markCoachAction(user.id);
    await recordAuditEvent({
      actorUserId: user.id,
      action: "api_key_revoked",
      payload: { apiKeyId: keyId, scope: "global_admin" },
    });
    logServerEvent({
      category: "admin",
      action: "api_key_revoked",
      meta: { actorUserId: user.id, apiKeyId: keyId, scope: "global_admin" },
    });

    return NextResponse.json({ ok: true });
  }
);
