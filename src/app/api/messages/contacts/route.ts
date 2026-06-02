import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { listDirectMessageTargets } from "@/lib/server/messaging";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const contacts = await listDirectMessageTargets(user);
    return NextResponse.json({ contacts });
  } catch {
    return NextResponse.json(
      { error: "Chargement des contacts impossible." },
      { status: 500 }
    );
  }
}
