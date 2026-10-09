import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { reviewAccountDeletionRequest } from "@/lib/server/compliance";
import { accountDeletionReviewSchema } from "@/lib/server/requestSchemas";
import { parseRouteId } from "@/lib/server/routeParams";

export const PATCH = withSessionHandler(
  {
    access: "admin",
    body: accountDeletionReviewSchema,
    fallbackMessage: "Traitement impossible.",
  },
  async ({ user, body, params }) => {
    const id = parseRouteId(params.id as string);
    if (!id) {
      return NextResponse.json({ error: "Demande invalide." }, { status: 400 });
    }

    const result = await reviewAccountDeletionRequest({
      requestId: id,
      action: body.action,
      reviewNote: body.reviewNote,
      actor: user,
    });

    return NextResponse.json(result);
  }
);
