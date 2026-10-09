import { NextResponse } from "next/server";
import { canCoach } from "@/lib/authz";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { revokeApiKey } from "@/lib/server/apiKeys";
import { parseRouteId } from "@/lib/server/routeParams";

export const DELETE = withSessionHandler(
  { access: "user", fallbackMessage: "Révocation impossible." },
  async ({ user, params }) => {
    if (!canCoach(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const keyId = parseRouteId(params.keyId as string);
    if (!keyId) {
      return NextResponse.json({ error: "Clé API invalide." }, { status: 400 });
    }

    await revokeApiKey(user.id, keyId);
    return NextResponse.json({ ok: true });
  }
);
