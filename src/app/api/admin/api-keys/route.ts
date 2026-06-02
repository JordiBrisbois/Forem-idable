import { NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/coach";
import { listApiKeysForAdmin } from "@/lib/server/apiKeys";

export async function GET() {
  try {
    const admin = await requireAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const apiKeys = await listApiKeysForAdmin();
    return NextResponse.json({ apiKeys });
  } catch {
    return NextResponse.json({ error: "Chargement des clés API impossible." }, { status: 500 });
  }
}
