import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { publishMessageEvent } from "@/lib/server/messageEvents";
import { findOrCreateDirectConversation } from "@/lib/server/messaging";
import { directConversationRequestSchema } from "@/lib/server/messagingSchemas";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";

export async function POST(request: NextRequest) {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = directConversationRequestSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: "Demande invalide." }, { status: 400 });
    }

    const conversation = await findOrCreateDirectConversation(user, body.data.targetUserId);
    await publishMessageEvent(
      conversation.participants.map((participant) => participant.userId),
      {
        type: "conversation.created",
        conversationId: conversation.id,
      }
    );

    return NextResponse.json({ conversation });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (error instanceof Error && error.message === "NotFound") {
      return NextResponse.json({ error: "Destinataire introuvable." }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Création du message privé impossible." },
      { status: 500 }
    );
  }
}
