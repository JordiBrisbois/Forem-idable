import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, updateUserProfile } from "@/lib/server/auth";
import { logServerEvent, withRequestContext } from "@/lib/server/observability";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { profileUpdateSchema, readValidatedJson } from "@/lib/server/requestSchemas";

export async function GET(request: NextRequest) {
  return withRequestContext(request, async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      return NextResponse.json({ user });
    } catch (error) {
      logServerEvent({
        category: "account",
        action: "profile_load_failed",
        level: "error",
        meta: {
          error: error instanceof Error ? error.message : "unknown",
        },
      });

      return NextResponse.json({ error: "Compte indisponible." }, { status: 500 });
    }
  });
}

export async function PATCH(request: NextRequest) {
  return withRequestContext(request, async () => {
    try {
      const forbidden = rejectCrossOriginRequest(request);
      if (forbidden) return forbidden;

      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const parsed = await readValidatedJson(request, profileUpdateSchema);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }

      const { firstName, lastName } = parsed.data;
      await updateUserProfile(user.id, firstName, lastName);
      return NextResponse.json({
        user: {
          ...user,
          firstName,
          lastName,
        },
      });
    } catch (error) {
      logServerEvent({
        category: "account",
        action: "profile_update_failed",
        level: "error",
        meta: {
          error: error instanceof Error ? error.message : "unknown",
        },
      });

      return NextResponse.json({ error: "Mise à jour du profil impossible." }, { status: 500 });
    }
  });
}
