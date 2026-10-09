import { NextResponse } from "next/server";
import { runtimeConfig } from "@/config/runtime";
import { withExternalHandler } from "@/lib/server/apiHandler";
import { buildGroupsCsv, getExternalGroups } from "@/lib/server/externalApi";
import { csvResponse, getRequestedFormat, parseExternalFilters } from "@/lib/server/externalApiRoute";

export const GET = withExternalHandler(
  { fallbackMessage: "Export groupes impossible." },
  async ({ request, actor }) => {
    const response = await getExternalGroups(actor, parseExternalFilters(request));
    if (getRequestedFormat(request) === "csv") {
      return csvResponse(
        `${runtimeConfig.app.exportFilenamePrefix}-groups.csv`,
        buildGroupsCsv(response.groups)
      );
    }

    return NextResponse.json(response);
  }
);
