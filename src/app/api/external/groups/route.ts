import { NextRequest, NextResponse } from "next/server";
import { runtimeConfig } from "@/config/runtime";
import { buildGroupsCsv, getExternalGroups } from "@/lib/server/externalApi";
import {
  csvResponse,
  getRequestedFormat,
  parseExternalFilters,
  requireExternalApiAccess,
} from "@/lib/server/externalApiRoute";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireExternalApiAccess();
    if (actor instanceof NextResponse) return actor;

    const response = await getExternalGroups(actor, parseExternalFilters(request));
    if (getRequestedFormat(request) === "csv") {
      return csvResponse(
        `${runtimeConfig.app.exportFilenamePrefix}-groups.csv`,
        buildGroupsCsv(response.groups)
      );
    }

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "Export groupes impossible." }, { status: 500 });
  }
}
