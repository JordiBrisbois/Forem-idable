import { NextResponse } from "next/server";
import { runtimeConfig } from "@/config/runtime";
import { withExternalHandler } from "@/lib/server/apiHandler";
import {
  buildApplicationsCsv,
  getExternalApplications,
  getExternalUserDetail,
} from "@/lib/server/externalApi";
import { csvResponse, getRequestedFormat } from "@/lib/server/externalApiRoute";
import { parseRouteId } from "@/lib/server/routeParams";

export const GET = withExternalHandler(
  { fallbackMessage: "Export utilisateur impossible." },
  async ({ request, actor, params }) => {
    const userId = parseRouteId(params.userId as string);
    if (!userId) {
      return NextResponse.json({ error: "Utilisateur invalide." }, { status: 400 });
    }

    const user = await getExternalUserDetail(actor, userId);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    if (getRequestedFormat(request) === "csv") {
      const applicationsResponse = await getExternalApplications(actor, {
        userId,
        includePrivateNote: true,
        includeSharedNotes: true,
        includeContributors: true,
        limit: 500,
      });
      return csvResponse(
        `${runtimeConfig.app.exportFilenamePrefix}-user-${userId}.csv`,
        buildApplicationsCsv(applicationsResponse.applications)
      );
    }

    return NextResponse.json({ actor, user });
  }
);
