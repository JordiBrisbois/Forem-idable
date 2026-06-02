import { NextRequest, NextResponse } from "next/server";
import {
  cancelPendingAccountDeletionRequest,
  createAccountDeletionRequest,
  listAccountDeletionRequests,
} from "@/lib/server/compliance";
import { getCurrentUser } from "@/lib/server/auth";
import { logServerEvent, withRequestContext } from "@/lib/server/observability";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { accountDeletionRequestSchema, readValidatedJson } from "@/lib/server/requestSchemas";

export async function GET(request: NextRequest) {
  return withRequestContext(request, async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const requests = await listAccountDeletionRequests(user.id);
      return NextResponse.json({ requests });
    } catch (error) {
      logServerEvent({
        category: "account",
        action: "deletion_request_list_failed",
        level: "error",
        meta: {
          error: error instanceof Error ? error.message : "unknown",
        },
      });

      return NextResponse.json({ error: "Demandes indisponibles." }, { status: 500 });
    }
  });
}

export async function POST(request: NextRequest) {
  return withRequestContext(request, async () => {
    try {
      const forbidden = rejectCrossOriginRequest(request);
      if (forbidden) return forbidden;

      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const parsed = await readValidatedJson(request, accountDeletionRequestSchema);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }

      const deletionRequest = await createAccountDeletionRequest(user, parsed.data.reason);
      return NextResponse.json({ request: deletionRequest }, { status: 201 });
    } catch (error) {
      const errorName = error instanceof Error ? error.name : "unknown";
      const errorMessage = error instanceof Error ? error.message : "unknown";

      logServerEvent({
        category: "account",
        action: "deletion_request_create_failed",
        level:
          errorName === "ActiveLegalHoldError" || errorName === "DuplicateDeletionRequestError"
            ? "warn"
            : "error",
        meta: {
          error: errorMessage,
          errorName,
        },
      });

      if (error instanceof Error) {
        if (error.name === "ActiveLegalHoldError") {
          return NextResponse.json({ error: error.message }, { status: 409 });
        }

        if (error.name === "DuplicateDeletionRequestError") {
          return NextResponse.json({ error: error.message }, { status: 409 });
        }
      }

      return NextResponse.json({ error: "Demande impossible." }, { status: 500 });
    }
  });
}

export async function DELETE(request: NextRequest) {
  return withRequestContext(request, async () => {
    try {
      const forbidden = rejectCrossOriginRequest(request);
      if (forbidden) return forbidden;

      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const cancelled = await cancelPendingAccountDeletionRequest(user);
      if (!cancelled) {
        return NextResponse.json({ error: "Aucune demande en attente." }, { status: 404 });
      }

      return NextResponse.json({ request: cancelled });
    } catch (error) {
      logServerEvent({
        category: "account",
        action: "deletion_request_cancel_failed",
        level: "error",
        meta: {
          error: error instanceof Error ? error.message : "unknown",
        },
      });

      return NextResponse.json({ error: "Annulation impossible." }, { status: 500 });
    }
  });
}
