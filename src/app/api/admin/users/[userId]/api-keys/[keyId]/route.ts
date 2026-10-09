import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { revokeApiKey } from "@/lib/server/apiKeys";
import { markCoachAction } from "@/lib/server/coach";
import { parseRouteId } from "@/lib/server/routeParams";

export const DELETE = withSessionHandler(
  { access: "admin", fallbackMessage: "Révocation impossible." },
  async ({ user, params }) => {
    const userId = parseRouteId(params.userId as string);
    const keyId = parseRouteId(params.keyId as string);
    if (!userId || !keyId) {
      return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
    }

    await revokeApiKey(userId, keyId);
    await markCoachAction(user.id);
    return NextResponse.json({ ok: true });
  }
);
