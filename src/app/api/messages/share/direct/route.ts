import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { publishMessageEvent } from "@/lib/server/messageEvents";
import { shareTextInDirectConversation } from "@/lib/server/messaging";
import { shareDirectMessageSchema } from "@/lib/server/messagingSchemas";

export const POST = withSessionHandler(
  {
    access: "user",
    body: shareDirectMessageSchema,
    bodyErrorMessage: "Demande invalide.",
    forbiddenMessage: "Ce destinataire n'est pas disponible en message privé.",
    notFoundMessage: "Destinataire introuvable.",
    fallbackMessage: "Partage privé impossible.",
  },
  async ({ user, body }) => {
    const result = await shareTextInDirectConversation(
      user,
      body.targetUserId,
      body.content
    );

    await publishMessageEvent([user.id, body.targetUserId], {
      type: "conversation.message_created",
      conversationId: result.conversationId,
      messageId: result.message.id,
      message: result.message,
    });

    return NextResponse.json(result);
  }
);
