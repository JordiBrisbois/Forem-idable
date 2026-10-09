import { NextResponse } from "next/server";
import { runtimeConfig } from "@/config/runtime";
import { withExternalHandler } from "@/lib/server/apiHandler";
import { buildUsersCsv, getExternalUsers } from "@/lib/server/externalApi";
import { csvResponse, getRequestedFormat, parseExternalFilters } from "@/lib/server/externalApiRoute";

export const GET = withExternalHandler(
  { fallbackMessage: "Export utilisateurs impossible." },
  async ({ request, actor }) => {
    const response = await getExternalUsers(actor, parseExternalFilters(request));
    if (getRequestedFormat(request) === "csv") {
      return csvResponse(
        `${runtimeConfig.app.exportFilenamePrefix}-users.csv`,
        buildUsersCsv(response.users)
      );
    }

    return NextResponse.json(response);
  }
);
