import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { createUserDataExport, listUserDataExportRequests } from "@/lib/server/compliance";

export const GET = withSessionHandler(
  { access: "user", fallbackMessage: "Exports indisponibles." },
  async ({ user }) => NextResponse.json({ requests: await listUserDataExportRequests(user.id) })
);

export const POST = withSessionHandler(
  { access: "user", fallbackMessage: "Export impossible." },
  async ({ user }) => {
    const exportRequest = await createUserDataExport(user);
    return NextResponse.json({ request: exportRequest }, { status: 201 });
  }
);
