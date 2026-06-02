import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getUserPasswordHash, setUserPassword, verifyPassword } from "@/lib/server/auth";
import { logServerEvent, withRequestContext } from "@/lib/server/observability";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { passwordUpdateSchema, readValidatedJson } from "@/lib/server/requestSchemas";

export async function PATCH(request: NextRequest) {
  return withRequestContext(request, async () => {
    try {
      const forbidden = rejectCrossOriginRequest(request);
      if (forbidden) return forbidden;

      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const parsed = await readValidatedJson(request, passwordUpdateSchema);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }

      const { currentPassword, password } = parsed.data;

      const storedHash = await getUserPasswordHash(user.id);
      if (!storedHash || !verifyPassword(currentPassword, storedHash)) {
        return NextResponse.json(
          { error: "Mot de passe actuel incorrect." },
          { status: 400 }
        );
      }

      await setUserPassword(user.id, password);
      return NextResponse.json({ ok: true });
    } catch (error) {
      logServerEvent({
        category: "account",
        action: "password_update_failed",
        level: "error",
        meta: {
          error: error instanceof Error ? error.message : "unknown",
        },
      });

      return NextResponse.json({ error: "Mise à jour du mot de passe impossible." }, { status: 500 });
    }
  });
}
