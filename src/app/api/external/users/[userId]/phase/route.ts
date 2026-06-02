import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateUserPhase } from "@/lib/server/coachGroups";
import { requireExternalApiAccess } from "@/lib/server/externalApiRoute";

const bodySchema = z.object({
  phase: z.enum(["internship_search", "job_search", "placed", "dropped"]),
  reason: z.string().optional(),
});

function parseUserId(value: string) {
  const userId = Number(value);
  return Number.isInteger(userId) ? userId : null;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const actor = await requireExternalApiAccess();
    if (actor instanceof NextResponse) return actor;

    const { userId: rawUserId } = await context.params;
    const userId = parseUserId(rawUserId);
    const body = await request.json();
    const parseResult = bodySchema.safeParse(body);

    if (!userId || !parseResult.success) {
      return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
    }

    const { phase, reason } = parseResult.data;
    await updateUserPhase(userId, phase, reason, actor);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "Changement de phase impossible." }, { status: 500 });
  }
}
