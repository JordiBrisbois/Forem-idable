import { NextResponse } from "next/server";
import { canCoach } from "@/lib/authz";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { createApiKey, listApiKeysForUser } from "@/lib/server/apiKeys";
import { apiKeyCreateRequestSchema } from "@/lib/server/requestSchemas";

export const GET = withSessionHandler(
  { access: "user", fallbackMessage: "Chargement des clés API impossible." },
  async ({ user }) => {
    if (!canCoach(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const apiKeys = await listApiKeysForUser(user.id);
    return NextResponse.json({ apiKeys });
  }
);

export const POST = withSessionHandler(
  {
    access: "user",
    body: apiKeyCreateRequestSchema,
    fallbackMessage: "Création de la clé API impossible.",
  },
  async ({ user, body }) => {
    if (!canCoach(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await createApiKey(user.id, body.name, body.expiresAt);
    return NextResponse.json(result);
  }
);
