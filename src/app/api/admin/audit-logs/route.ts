import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { listAdminAuditLogs } from "@/lib/server/auditLog";

export const GET = withSessionHandler(
  { access: "admin", fallbackMessage: "Audit logs indisponibles." },
  async ({ request }) => {
    const requestedLimit = Number(request.nextUrl.searchParams.get("limit"));
    return NextResponse.json({ logs: await listAdminAuditLogs(requestedLimit) });
  }
);
