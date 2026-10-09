import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { setBeneficiaryStage } from "@/lib/server/coachGroups";
import { beneficiaryStageUpdateSchema } from "@/lib/server/requestSchemas";
import { parseRouteId } from "@/lib/server/routeParams";

export const PATCH = withSessionHandler(
  {
    access: "coach",
    body: beneficiaryStageUpdateSchema,
    fallbackMessage: "Changement d'étape impossible.",
  },
  async ({ user, body, params }) => {
    const userId = parseRouteId(params.userId as string);
    if (!userId) {
      return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
    }

    await setBeneficiaryStage(userId, body.stage, body.reason, user);
    return NextResponse.json({ ok: true });
  }
);
