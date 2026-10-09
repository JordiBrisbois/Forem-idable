import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { publishConversationEvent } from "@/lib/server/messageEvents";
import { markConversationAsRead } from "@/lib/server/messaging";
import { parseRouteId } from "@/lib/server/routeParams";

export const POST = withSessionHandler(
  { access: "user", fallbackMessage: "Mise à jour de lecture impossible." },
  async ({ user, params }) => {
    const conversationId = parseRouteId(params.conversationId as string);
    if (!conversationId) {
      return NextResponse.json({ error: "Conversation invalide." }, { status: 400 });
    }

    await markConversationAsRead(user, conversationId);
    await publishConversationEvent(conversationId, {
      type: "conversation.read_updated",
      conversationId,
      userId: user.id,
    });

    return NextResponse.json({ ok: true });
  }
);
