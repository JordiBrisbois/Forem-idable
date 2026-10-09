import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { createBeneficiaryAccount } from "@/lib/server/accounts";
import { beneficiaryCreateRequestSchema } from "@/lib/server/requestSchemas";

export const POST = withSessionHandler(
  {
    access: "admin",
    body: beneficiaryCreateRequestSchema,
    fallbackMessage: "Création du bénéficiaire impossible.",
  },
  async ({ user, body }) => {
    const { user: created, temporaryPassword } = await createBeneficiaryAccount(user, body);
    return NextResponse.json({ ok: true, user: created, temporaryPassword });
  }
);
