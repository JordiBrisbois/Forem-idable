import { NextRequest, NextResponse } from "next/server";
import { createBeneficiaryAccount } from "@/lib/server/accounts";
import { requireAdminAccess } from "@/lib/server/coach";
import { withRequestContext } from "@/lib/server/observability";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import {
  beneficiaryCreateRequestSchema,
  readValidatedJson,
} from "@/lib/server/requestSchemas";

export async function POST(request: NextRequest) {
  return withRequestContext(request, async () => {
    try {
      const forbidden = rejectCrossOriginRequest(request);
      if (forbidden) return forbidden;

      const user = await requireAdminAccess();
      if (!user) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const parsed = await readValidatedJson(request, beneficiaryCreateRequestSchema);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }

      const { user: created, temporaryPassword } = await createBeneficiaryAccount(
        user,
        parsed.data
      );
      return NextResponse.json({ ok: true, user: created, temporaryPassword });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";

      if (message.includes("duplicate") || message.includes("unique")) {
        return NextResponse.json(
          { error: "Un compte existe déjà avec cette adresse email." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Création du bénéficiaire impossible." },
        { status: 500 }
      );
    }
  });
}
