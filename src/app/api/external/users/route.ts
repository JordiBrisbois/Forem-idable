import { NextRequest, NextResponse } from "next/server";
import { runtimeConfig } from "@/config/runtime";
import { buildUsersCsv, getExternalUsers } from "@/lib/server/externalApi";
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

    const response = await getExternalUsers(actor, parseExternalFilters(request));
    if (getRequestedFormat(request) === "csv") {
      return csvResponse(
        `${runtimeConfig.app.exportFilenamePrefix}-users.csv`,
        buildUsersCsv(response.users)
      );
    }

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "Export utilisateurs impossible." }, { status: 500 });
  }
}
