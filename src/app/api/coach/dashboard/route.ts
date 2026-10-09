import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { getCoachDashboard } from "@/lib/server/coach";

export const GET = withSessionHandler(
  { access: "coach", fallbackMessage: "Impossible de charger le suivi coach." },
  async ({ user }) => NextResponse.json({ dashboard: await getCoachDashboard(user) })
);
