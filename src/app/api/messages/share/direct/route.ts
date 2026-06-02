import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { publishMessageEvent } from "@/lib/server/messageEvents";
import { shareTextInDirectConversation } from "@/lib/server/messaging";
import { shareDirectMessageSchema } from "@/lib/server/messagingSchemas";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";

export async function POST(request: NextRequest) {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = shareDirectMessageSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: "Demande invalide." }, { status: 400 });
    }

    const result = await shareTextInDirectConversation(
      user,
      body.data.targetUserId,
      body.data.content
    );

    await publishMessageEvent([user.id, body.data.targetUserId], {
      type: "conversation.message_created",
      conversationId: result.conversationId,
      messageId: result.message.id,
      message: result.message,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json(
        { error: "Ce destinataire n'est pas disponible en message privé." },
        { status: 403 }
      );
    }

    if (error instanceof Error && error.message === "NotFound") {
      return NextResponse.json({ error: "Destinataire introuvable." }, { status: 404 });
    }

    if (error instanceof Error && error.message === "InvalidDirectMessageContent") {
      return NextResponse.json({ error: "Message privé invalide." }, { status: 400 });
    }

    return NextResponse.json({ error: "Partage privé impossible." }, { status: 500 });
  }
}
