import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { publishConversationEvent } from "@/lib/server/messageEvents";
import { sendTextMessage } from "@/lib/server/messaging";
import { sendConversationMessageSchema } from "@/lib/server/messagingSchemas";
import { checkRateLimit } from "@/lib/server/rateLimit";
import { parseRouteId } from "@/lib/server/routeParams";

export const POST = withSessionHandler(
  {
    access: "user",
    body: sendConversationMessageSchema,
    bodyErrorMessage: "Message invalide.",
    fallbackMessage: "Envoi du message impossible.",
  },
  async ({ user, body, params }) => {
    const rateLimit = await checkRateLimit({
      scope: "messages-send",
      limit: 60,
      windowMs: 60 * 1000,
      identifier: String(user.id),
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de messages envoyés. Veuillez patienter." },
        { status: 429 }
      );
    }

    const conversationId = parseRouteId(params.conversationId as string);
    if (!conversationId) {
      return NextResponse.json({ error: "Conversation invalide." }, { status: 400 });
    }

    const result = await sendTextMessage(user, conversationId, body.content);
    if ("cleared" in result) {
      await publishConversationEvent(conversationId, {
        type: "conversation.cleared",
        conversationId,
      });
      return NextResponse.json({ cleared: true });
    }

    await publishConversationEvent(conversationId, {
      type: "conversation.message_created",
      conversationId,
      messageId: result.id,
      message: result,
    });

    return NextResponse.json({ message: result });
  }
);
