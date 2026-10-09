import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { getConversationDetail } from "@/lib/server/messaging";
import { parseRouteId } from "@/lib/server/routeParams";

export const GET = withSessionHandler(
  { access: "user", fallbackMessage: "Chargement de la conversation impossible." },
  async ({ user, params }) => {
    const conversationId = parseRouteId(params.conversationId as string);
    if (!conversationId) {
      return NextResponse.json({ error: "Conversation invalide." }, { status: 400 });
    }

    return NextResponse.json({
      conversation: await getConversationDetail(user, conversationId),
    });
  }
);
