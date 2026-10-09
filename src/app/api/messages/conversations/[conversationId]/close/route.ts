import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { closeDirectConversation } from "@/lib/server/messaging";
import { parseRouteId } from "@/lib/server/routeParams";

export const POST = withSessionHandler(
  { access: "user", fallbackMessage: "Fermeture du DM impossible." },
  async ({ user, params }) => {
    const conversationId = parseRouteId(params.conversationId as string);
    if (!conversationId) {
      return NextResponse.json({ error: "Conversation invalide." }, { status: 400 });
    }

    await closeDirectConversation(user, conversationId);
    return NextResponse.json({ ok: true });
  }
);
