import { NextResponse } from "next/server";
import { runtimeConfig } from "@/config/runtime";
import { withExternalHandler } from "@/lib/server/apiHandler";
import {
  buildApplicationsCsv,
  getExternalApplications,
  getExternalGroupDetail,
} from "@/lib/server/externalApi";
import { csvResponse, getRequestedFormat } from "@/lib/server/externalApiRoute";
import { parseRouteId } from "@/lib/server/routeParams";

export const GET = withExternalHandler(
  { fallbackMessage: "Export groupe impossible." },
  async ({ request, actor, params }) => {
    const groupId = parseRouteId(params.groupId as string);
    if (!groupId) {
      return NextResponse.json({ error: "Classe invalide." }, { status: 400 });
    }

    const group = await getExternalGroupDetail(actor, groupId);
    if (!group) {
      return NextResponse.json({ error: "Classe introuvable." }, { status: 404 });
    }

    if (getRequestedFormat(request) === "csv") {
      const applicationsResponse = await getExternalApplications(actor, {
        groupId,
        includePrivateNote: true,
        includeSharedNotes: true,
        includeContributors: true,
        limit: 500,
      });
      return csvResponse(
        `${runtimeConfig.app.exportFilenamePrefix}-group-${groupId}.csv`,
        buildApplicationsCsv(applicationsResponse.applications)
      );
    }

    return NextResponse.json({ actor, group });
  }
);
