import { NextRequest, NextResponse } from "next/server";
import { runtimeConfig } from "@/config/runtime";
import { buildApplicationsCsv, getExternalApplications } from "@/lib/server/externalApi";
import {
  csvResponse,
  getRequestedFormat,
  requireExternalApiAccess,
} from "@/lib/server/externalApiRoute";
import { getExternalUserDetail } from "@/lib/server/externalApi";

function parseUserId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const actor = await requireExternalApiAccess();
    if (actor instanceof NextResponse) return actor;

    const { userId: rawUserId } = await context.params;
    const userId = parseUserId(rawUserId);
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
  } catch {
    return NextResponse.json({ error: "Export utilisateur impossible." }, { status: 500 });
  }
}
