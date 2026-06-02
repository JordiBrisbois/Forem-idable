import { NextResponse } from "next/server";
import { listAccountDeletionRequestsForAdmin } from "@/lib/server/compliance";
import { requireAdminAccess } from "@/lib/server/coach";

export async function GET() {
  try {
    const admin = await requireAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const requests = await listAccountDeletionRequestsForAdmin();
    return NextResponse.json({ requests });
  } catch {
    return NextResponse.json({ error: "Demandes indisponibles." }, { status: 500 });
  }
}
