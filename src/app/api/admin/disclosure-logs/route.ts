import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { createDisclosureLog, listDisclosureLogs } from "@/lib/server/compliance";
import { disclosureLogCreateSchema } from "@/lib/server/requestSchemas";

export const GET = withSessionHandler(
  { access: "admin", fallbackMessage: "Disclosure logs indisponibles." },
  async () => NextResponse.json({ logs: await listDisclosureLogs() })
);

export const POST = withSessionHandler(
  {
    access: "admin",
    body: disclosureLogCreateSchema,
    fallbackMessage: "Journalisation impossible.",
  },
  async ({ user, body }) => {
    const log = await createDisclosureLog({
      actorUserId: user.id,
      requestType: body.requestType ?? "authority_request",
      authorityName: body.authorityName,
      legalBasis: body.legalBasis,
      targetType: body.targetType,
      targetId: body.targetId,
      scopeSummary: body.scopeSummary,
      exportReference: body.exportReference,
    });

    return NextResponse.json({ log }, { status: 201 });
  }
);
