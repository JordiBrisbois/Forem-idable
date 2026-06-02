import { NextRequest, NextResponse } from "next/server";
import { listAdminAuditLogs } from "@/lib/server/auditLog";
import { requireAdminAccess } from "@/lib/server/coach";
import { logServerEvent, withRequestContext } from "@/lib/server/observability";

export async function GET(request: NextRequest) {
  return withRequestContext(request, async () => {
    try {
      const admin = await requireAdminAccess();
      if (!admin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const requestedLimit = Number(request.nextUrl.searchParams.get("limit"));
      const logs = await listAdminAuditLogs(requestedLimit);
      return NextResponse.json({ logs });
    } catch (error) {
      logServerEvent({
        category: "admin",
        action: "audit_logs_list_failed",
        level: "error",
        meta: {
          error: error instanceof Error ? error.message : "unknown",
        },
      });

      return NextResponse.json({ error: "Audit logs indisponibles." }, { status: 500 });
    }
  });
}
