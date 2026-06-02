import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess, setUserRole } from "@/lib/server/coach";
import { withRequestContext } from "@/lib/server/observability";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import {
  positiveIntegerBodySchema,
  positiveIntegerParamSchema,
  readValidatedJson,
} from "@/lib/server/requestSchemas";

export async function POST(request: NextRequest) {
  return withRequestContext(request, async () => {
    try {
      const forbidden = rejectCrossOriginRequest(request);
      if (forbidden) return forbidden;

      const user = await requireAdminAccess();
      if (!user) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const parsed = await readValidatedJson(request, positiveIntegerBodySchema);
      if (!parsed.success) {
        return NextResponse.json({ error: "Utilisateur invalide." }, { status: 400 });
      }

      await setUserRole(parsed.data.userId, "coach", user.id);
      return NextResponse.json({ ok: true });
    } catch (error) {
      if (error instanceof Error && error.message === "User not found") {
        return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
      }

      return NextResponse.json({ error: "Promotion coach impossible." }, { status: 500 });
    }
  });
}

export async function DELETE(request: NextRequest) {
  return withRequestContext(request, async () => {
    try {
      const forbidden = rejectCrossOriginRequest(request);
      if (forbidden) return forbidden;

      const user = await requireAdminAccess();
      if (!user) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const parsed = positiveIntegerParamSchema.safeParse(
        request.nextUrl.searchParams.get("userId")
      );
      if (!parsed.success) {
        return NextResponse.json({ error: "Utilisateur invalide." }, { status: 400 });
      }

      await setUserRole(parsed.data, "user", user.id);
      return NextResponse.json({ ok: true });
    } catch (error) {
      if (error instanceof Error && error.message === "User not found") {
        return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
      }

      return NextResponse.json({ error: "Retrait du rôle coach impossible." }, { status: 500 });
    }
  });
}
