import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/coach";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import {
  accountDeletionReviewSchema,
  parseIntegerParam,
  readValidatedJson,
} from "@/lib/server/requestSchemas";
import { reviewAccountDeletionRequest } from "@/lib/server/compliance";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const admin = await requireAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: rawId } = await context.params;
    const id = parseIntegerParam(rawId);
    if (!id) {
      return NextResponse.json({ error: "Demande invalide." }, { status: 400 });
    }

    const parsed = await readValidatedJson(request, accountDeletionReviewSchema);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const result = await reviewAccountDeletionRequest({
      requestId: id,
      action: parsed.data.action,
      reviewNote: parsed.data.reviewNote,
      actor: admin,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "DeletionRequestNotFoundError") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      if (error.name === "DeletionRequestStatusError" || error.name === "ActiveLegalHoldError") {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    return NextResponse.json({ error: "Traitement impossible." }, { status: 500 });
  }
}
