import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { archiveCoachGroup } from "@/lib/server/coachGroups";
import { groupArchiveSchema } from "@/lib/server/requestSchemas";
import { parseRouteId } from "@/lib/server/routeParams";

export const PATCH = withSessionHandler(
  { access: "coach", body: groupArchiveSchema, fallbackMessage: "Archivage impossible." },
  async ({ user, body, params }) => {
    const groupId = parseRouteId(params.groupId as string);
    if (!groupId) {
      return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
    }

    await archiveCoachGroup(groupId, body.archived, user);
    return NextResponse.json({ ok: true });
  }
);
