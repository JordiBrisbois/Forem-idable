import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { listApiKeysForAdmin } from "@/lib/server/apiKeys";

export const GET = withSessionHandler(
  { access: "admin", fallbackMessage: "Chargement des clés API impossible." },
  async () => NextResponse.json({ apiKeys: await listApiKeysForAdmin() })
);
