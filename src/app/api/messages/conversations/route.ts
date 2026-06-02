import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { listVisibleConversations } from "@/lib/server/messaging";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const conversations = await listVisibleConversations(user);
    return NextResponse.json({ conversations });
  } catch {
    return NextResponse.json(
      { error: "Chargement des conversations impossible." },
      { status: 500 }
    );
  }
}
