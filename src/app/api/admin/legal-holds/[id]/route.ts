import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { releaseLegalHold } from "@/lib/server/compliance";
import { parseRouteId } from "@/lib/server/routeParams";

export const DELETE = withSessionHandler(
  { access: "admin", fallbackMessage: "Libération impossible." },
  async ({ user, params }) => {
    const id = parseRouteId(params.id as string);
    if (!id) {
      return NextResponse.json({ error: "Legal hold invalide." }, { status: 400 });
    }

    const hold = await releaseLegalHold(id, user.id);
    if (!hold) {
      return NextResponse.json({ error: "Legal hold introuvable." }, { status: 404 });
    }

    return NextResponse.json({ hold });
  }
);
