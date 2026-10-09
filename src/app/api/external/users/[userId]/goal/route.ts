import { NextResponse } from "next/server";
import { withExternalHandler } from "@/lib/server/apiHandler";
import { setUserSearchGoal } from "@/lib/server/coachGroups";
import { searchGoalUpdateSchema } from "@/lib/server/requestSchemas";
import { parseRouteId } from "@/lib/server/routeParams";

export const PATCH = withExternalHandler(
  {
    body: searchGoalUpdateSchema,
    fallbackMessage: "Changement d'objectif impossible.",
  },
  async ({ actor, body, params }) => {
    const userId = parseRouteId(params.userId as string);
    if (!userId) {
      return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
    }

    await setUserSearchGoal(userId, body.goal, body.reason, actor);
    return NextResponse.json({ ok: true });
  }
);
