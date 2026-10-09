import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { createLegalHold, listActiveLegalHolds } from "@/lib/server/compliance";
import { legalHoldCreateSchema } from "@/lib/server/requestSchemas";

export const GET = withSessionHandler(
  { access: "admin", fallbackMessage: "Legal holds indisponibles." },
  async () => NextResponse.json({ holds: await listActiveLegalHolds() })
);

export const POST = withSessionHandler(
  {
    access: "admin",
    body: legalHoldCreateSchema,
    fallbackMessage: "Création du legal hold impossible.",
  },
  async ({ user, body }) => {
    const hold = await createLegalHold({ actorUserId: user.id, ...body });
    return NextResponse.json({ hold }, { status: 201 });
  }
);
