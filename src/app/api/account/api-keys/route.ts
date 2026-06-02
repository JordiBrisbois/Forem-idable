import { NextRequest, NextResponse } from "next/server";
import { createApiKey, listApiKeysForUser } from "@/lib/server/apiKeys";
import { getCurrentUser } from "@/lib/server/auth";
import { logServerEvent, withRequestContext } from "@/lib/server/observability";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { apiKeyCreateRequestSchema, readValidatedJson } from "@/lib/server/requestSchemas";

function canManageApiKeys(role: string) {
  return role === "coach" || role === "admin";
}

export async function GET(request: NextRequest) {
  return withRequestContext(request, async () => {
    try {
      const user = await getCurrentUser();
      if (!user || !canManageApiKeys(user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const apiKeys = await listApiKeysForUser(user.id);
      return NextResponse.json({ apiKeys });
    } catch (error) {
      logServerEvent({
        category: "account",
        action: "api_keys_list_failed",
        level: "error",
        meta: {
          error: error instanceof Error ? error.message : "unknown",
        },
      });

      return NextResponse.json({ error: "Chargement des clés API impossible." }, { status: 500 });
    }
  });
}

export async function POST(request: NextRequest) {
  return withRequestContext(request, async () => {
    try {
      const forbidden = rejectCrossOriginRequest(request);
      if (forbidden) return forbidden;

      const user = await getCurrentUser();
      if (!user || !canManageApiKeys(user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const parsed = await readValidatedJson(request, apiKeyCreateRequestSchema);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }

      const { name, expiresAt } = parsed.data;
      const result = await createApiKey(user.id, name, expiresAt);
      return NextResponse.json(result);
    } catch (error) {
      logServerEvent({
        category: "account",
        action: "api_key_create_failed",
        level: "error",
        meta: {
          error: error instanceof Error ? error.message : "unknown",
        },
      });

      return NextResponse.json({ error: "Création de la clé API impossible." }, { status: 500 });
    }
  });
}
