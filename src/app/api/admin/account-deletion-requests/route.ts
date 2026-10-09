import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { listAccountDeletionRequestsForAdmin } from "@/lib/server/compliance";

export const GET = withSessionHandler(
  { access: "admin", fallbackMessage: "Demandes indisponibles." },
  async () => NextResponse.json({ requests: await listAccountDeletionRequestsForAdmin() })
);
