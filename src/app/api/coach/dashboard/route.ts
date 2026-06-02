import { NextRequest, NextResponse } from "next/server";
import { getCoachDashboard, requireCoachAccess } from "@/lib/server/coach";
import { logServerEvent, withRequestContext } from "@/lib/server/observability";

export async function GET(request: NextRequest) {
  return withRequestContext(request, async () => {
    try {
      const user = await requireCoachAccess();
      if (!user) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const dashboard = await getCoachDashboard(user);
      return NextResponse.json({ dashboard });
    } catch (error) {
      logServerEvent({
        category: "coach",
        action: "dashboard_load_failed",
        level: "error",
        meta: {
          error: error instanceof Error ? error.message : "unknown",
        },
      });

      return NextResponse.json({ error: "Impossible de charger le suivi coach." }, { status: 500 });
    }
  });
}
