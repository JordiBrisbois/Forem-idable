import { NextRequest, NextResponse } from "next/server";
import { revokeApiKey } from "@/lib/server/apiKeys";
import { getCurrentUser } from "@/lib/server/auth";
import { logServerEvent, withRequestContext } from "@/lib/server/observability";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";

function parseKeyId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}

function canManageApiKeys(role: string) {
  return role === "coach" || role === "admin";
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ keyId: string }> }
) {
  return withRequestContext(request, async () => {
    try {
      const forbidden = rejectCrossOriginRequest(request);
      if (forbidden) return forbidden;

      const user = await getCurrentUser();
      if (!user || !canManageApiKeys(user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { keyId: rawKeyId } = await context.params;
      const keyId = parseKeyId(rawKeyId);
      if (!keyId) {
        return NextResponse.json({ error: "Clé API invalide." }, { status: 400 });
      }

      await revokeApiKey(user.id, keyId);
      return NextResponse.json({ ok: true });
    } catch (error) {
      const { keyId: rawKeyId } = await context.params;
      const keyId = parseKeyId(rawKeyId);

      logServerEvent({
        category: "account",
        action: "api_key_revoke_failed",
        level: "error",
        meta: {
          keyId: keyId ?? undefined,
          error: error instanceof Error ? error.message : "unknown",
        },
      });

      return NextResponse.json({ error: "Révocation impossible." }, { status: 500 });
    }
  });
}
