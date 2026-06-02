import { NextRequest, NextResponse } from "next/server";
import { runtimeConfig } from "@/config/runtime";
import {
  buildApplicationsCsv,
  getExternalApplications,
  getExternalGroupDetail,
} from "@/lib/server/externalApi";
import {
  csvResponse,
  getRequestedFormat,
  requireExternalApiAccess,
} from "@/lib/server/externalApiRoute";

function parseGroupId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const actor = await requireExternalApiAccess();
    if (actor instanceof NextResponse) return actor;

    const { groupId: rawGroupId } = await context.params;
    const groupId = parseGroupId(rawGroupId);
    if (!groupId) {
      return NextResponse.json({ error: "Groupe invalide." }, { status: 400 });
    }

    const group = await getExternalGroupDetail(actor, groupId);
    if (!group) {
      return NextResponse.json({ error: "Groupe introuvable." }, { status: 404 });
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
  } catch {
    return NextResponse.json({ error: "Export groupe impossible." }, { status: 500 });
  }
}
