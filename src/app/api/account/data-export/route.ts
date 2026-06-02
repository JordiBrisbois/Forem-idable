import { NextRequest, NextResponse } from "next/server";
import { createUserDataExport, listUserDataExportRequests } from "@/lib/server/compliance";
import { getCurrentUser } from "@/lib/server/auth";
import { logServerEvent, withRequestContext } from "@/lib/server/observability";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";

export async function GET(request: NextRequest) {
  return withRequestContext(request, async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const requests = await listUserDataExportRequests(user.id);
      return NextResponse.json({ requests });
    } catch (error) {
      logServerEvent({
        category: "account",
        action: "data_export_list_failed",
        level: "error",
        meta: {
          error: error instanceof Error ? error.message : "unknown",
        },
      });

      return NextResponse.json({ error: "Exports indisponibles." }, { status: 500 });
    }
  });
}

export async function POST(request: NextRequest) {
  return withRequestContext(request, async () => {
    try {
      const forbidden = rejectCrossOriginRequest(request);
      if (forbidden) return forbidden;

      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const exportRequest = await createUserDataExport(user);
      return NextResponse.json({ request: exportRequest }, { status: 201 });
    } catch (error) {
      logServerEvent({
        category: "account",
        action: "data_export_create_failed",
        level: "error",
        meta: {
          error: error instanceof Error ? error.message : "unknown",
        },
      });

      return NextResponse.json({ error: "Export impossible." }, { status: 500 });
    }
  });
}
