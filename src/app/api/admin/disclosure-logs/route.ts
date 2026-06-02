import { NextRequest, NextResponse } from "next/server";
import { createDisclosureLog, listDisclosureLogs } from "@/lib/server/compliance";
import { requireAdminAccess } from "@/lib/server/coach";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { disclosureLogCreateSchema, readValidatedJson } from "@/lib/server/requestSchemas";

export async function GET() {
  try {
    const admin = await requireAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const logs = await listDisclosureLogs();
    return NextResponse.json({ logs });
  } catch {
    return NextResponse.json({ error: "Disclosure logs indisponibles." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const admin = await requireAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = await readValidatedJson(request, disclosureLogCreateSchema);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const log = await createDisclosureLog({
      actorUserId: admin.id,
      requestType: parsed.data.requestType ?? "authority_request",
      authorityName: parsed.data.authorityName,
      legalBasis: parsed.data.legalBasis,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      scopeSummary: parsed.data.scopeSummary,
      exportReference: parsed.data.exportReference,
    });
    return NextResponse.json({ log }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Journalisation impossible." }, { status: 500 });
  }
}
