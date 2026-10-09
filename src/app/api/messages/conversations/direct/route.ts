import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { publishMessageEvent } from "@/lib/server/messageEvents";
import { findOrCreateDirectConversation } from "@/lib/server/messaging";
import { directConversationRequestSchema } from "@/lib/server/messagingSchemas";

export const POST = withSessionHandler(
  {
    access: "user",
    body: directConversationRequestSchema,
    bodyErrorMessage: "Demande invalide.",
    notFoundMessage: "Destinataire introuvable.",
    fallbackMessage: "Création du message privé impossible.",
  },
  async ({ user, body }) => {
    const conversation = await findOrCreateDirectConversation(user, body.targetUserId);
    await publishMessageEvent(
      conversation.participants.map((participant) => participant.userId),
      { type: "conversation.created", conversationId: conversation.id }
    );

    return NextResponse.json({ conversation });
  }
);
