import { NextResponse } from "next/server";
import { runtimeConfig } from "@/config/runtime";
import { getCurrentUser } from "@/lib/server/auth";
import { getUserDataExportPayload } from "@/lib/server/compliance";
import { parseIntegerParam } from "@/lib/server/requestSchemas";

export async function GET(
  _request: Request,
  context: { params: Promise<{ requestId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId: rawRequestId } = await context.params;
    const requestId = parseIntegerParam(rawRequestId);
    if (!requestId) {
      return NextResponse.json({ error: "Export invalide." }, { status: 400 });
    }

    const exportRequest = await getUserDataExportPayload(user.id, requestId);
    if (!exportRequest) {
      return NextResponse.json({ error: "Export introuvable." }, { status: 404 });
    }

    if (exportRequest.summary.status !== "completed" || !exportRequest.payload) {
      return NextResponse.json({ error: "Export non disponible." }, { status: 409 });
    }

    const expiresAt = exportRequest.summary.expiresAt ? new Date(exportRequest.summary.expiresAt) : null;
    if (expiresAt && !Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() <= Date.now()) {
      return NextResponse.json({ error: "Export expiré." }, { status: 410 });
    }

    return new NextResponse(JSON.stringify(exportRequest.payload, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="${runtimeConfig.app.exportFilenamePrefix}-export-${requestId}.json"`,
        "cache-control": "no-store, private",
        pragma: "no-cache",
        expires: "0",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Téléchargement impossible." }, { status: 500 });
  }
}
