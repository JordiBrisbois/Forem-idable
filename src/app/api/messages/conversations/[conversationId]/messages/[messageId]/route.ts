import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { publishConversationEvent } from "@/lib/server/messageEvents";
import { deleteConversationMessage } from "@/lib/server/messaging";
import { parseRouteId } from "@/lib/server/routeParams";

export const DELETE = withSessionHandler(
  {
    access: "user",
    notFoundMessage: "Message introuvable.",
    fallbackMessage: "Suppression du message impossible.",
  },
  async ({ user, params }) => {
    const conversationId = parseRouteId(params.conversationId as string);
    const messageId = parseRouteId(params.messageId as string);
    if (!conversationId || !messageId) {
      return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
    }

    const message = await deleteConversationMessage(user, conversationId, messageId);
    await publishConversationEvent(conversationId, {
      type: "conversation.message_deleted",
      conversationId,
      messageId,
    });

    return NextResponse.json({ message });
  }
);
