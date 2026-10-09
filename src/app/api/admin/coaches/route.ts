import { NextRequest, NextResponse } from "next/server";
import { createCoachAccount } from "@/lib/server/accounts";
import { requireAdminAccess, setUserRole } from "@/lib/server/coach";
import { withRequestContext } from "@/lib/server/observability";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import {
  adminCoachCreateBodySchema,
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

      const parsed = await readValidatedJson(request, adminCoachCreateBodySchema);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }

      if ("userId" in parsed.data) {
        await setUserRole(parsed.data.userId, "coach", user.id);
        return NextResponse.json({ ok: true });
      }

      const { user: created, temporaryPassword } = await createCoachAccount(user, parsed.data);
      return NextResponse.json({ ok: true, user: created, temporaryPassword });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";

      if (message === "User not found") {
        return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
      }

      if (message === "CannotDemoteSelf") {
        return NextResponse.json(
          { error: "Vous ne pouvez pas retirer votre propre rôle administrateur." },
          { status: 400 }
        );
      }

      if (message === "LastAdmin") {
        return NextResponse.json(
          { error: "Impossible : il doit rester au moins un administrateur." },
          { status: 400 }
        );
      }

      if (message.includes("duplicate") || message.includes("unique")) {
        return NextResponse.json(
          { error: "Un compte existe déjà avec cette adresse email." },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: "Création du coach impossible." }, { status: 500 });
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

      if (error instanceof Error && error.message === "CannotDemoteSelf") {
        return NextResponse.json(
          { error: "Vous ne pouvez pas retirer votre propre rôle administrateur." },
          { status: 400 }
        );
      }

      if (error instanceof Error && error.message === "LastAdmin") {
        return NextResponse.json(
          { error: "Impossible : il doit rester au moins un administrateur." },
          { status: 400 }
        );
      }

      return NextResponse.json({ error: "Retrait du rôle coach impossible." }, { status: 500 });
    }
  });
}
