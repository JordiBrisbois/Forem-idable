import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/server/auth";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { checkRateLimit } from "@/lib/server/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await checkRateLimit({
      scope: "auth-logout",
      limit: 10,
      windowMs: 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez dans quelques instants." },
        { status: 429 }
      );
    }
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    await deleteSession();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Déconnexion impossible." }, { status: 500 });
  }
}
