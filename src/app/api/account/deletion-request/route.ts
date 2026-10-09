import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import {
  cancelPendingAccountDeletionRequest,
  createAccountDeletionRequest,
  listAccountDeletionRequests,
} from "@/lib/server/compliance";
import { accountDeletionRequestSchema } from "@/lib/server/requestSchemas";

export const GET = withSessionHandler(
  { access: "user", fallbackMessage: "Demandes indisponibles." },
  async ({ user }) => NextResponse.json({ requests: await listAccountDeletionRequests(user.id) })
);

export const POST = withSessionHandler(
  {
    access: "user",
    body: accountDeletionRequestSchema,
    fallbackMessage: "Demande impossible.",
  },
  async ({ user, body }) => {
    const deletionRequest = await createAccountDeletionRequest(user, body.reason);
    return NextResponse.json({ request: deletionRequest }, { status: 201 });
  }
);

export const DELETE = withSessionHandler(
  { access: "user", fallbackMessage: "Annulation impossible." },
  async ({ user }) => {
    const cancelled = await cancelPendingAccountDeletionRequest(user);
    if (!cancelled) {
      return NextResponse.json({ error: "Aucune demande en attente." }, { status: 404 });
    }

    return NextResponse.json({ request: cancelled });
  }
);
