import { NextResponse } from "next/server";
import { runtimeConfig } from "@/config/runtime";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { getUserDataExportPayload } from "@/lib/server/compliance";
import { parseRouteId } from "@/lib/server/routeParams";

export const GET = withSessionHandler(
  { access: "user", fallbackMessage: "Téléchargement impossible." },
  async ({ user, params }) => {
    const requestId = parseRouteId(params.requestId as string);
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

    const expiresAt = exportRequest.summary.expiresAt
      ? new Date(exportRequest.summary.expiresAt)
      : null;
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
  }
);
