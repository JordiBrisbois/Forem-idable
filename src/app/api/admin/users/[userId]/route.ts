import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/authz";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { deleteUserAccount, setUserPassword, updateUserProfile } from "@/lib/server/auth";
import { recordAuditEvent } from "@/lib/server/auditLog";
import { assertCanAccessCoachUser, markCoachAction } from "@/lib/server/coach";
import { assertNoActiveUserLegalHold } from "@/lib/server/compliance";
import { db, ensureDatabase } from "@/lib/server/db";
import { logServerEvent } from "@/lib/server/observability";
import { managedUserUpdateSchema } from "@/lib/server/requestSchemas";
import { parseRouteId } from "@/lib/server/routeParams";
import { UserRole } from "@/types/auth";

export const PATCH = withSessionHandler(
  {
    access: "coach",
    body: managedUserUpdateSchema,
    forbiddenMessage: "Modification interdite pour ce périmètre.",
    fallbackMessage: "Mise à jour utilisateur impossible.",
  },
  async ({ user: actor, body, params }) => {
    const userId = parseRouteId(params.userId as string);
    if (!userId) {
      return NextResponse.json({ error: "Utilisateur invalide." }, { status: 400 });
    }

    await ensureDatabase();
    const targetResult = await db.query<{ role: UserRole; email: string }>(
      `SELECT role, email FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );
    const target = targetResult.rows[0];
    if (!target) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    if (!isAdmin(actor.role)) {
      if (target.role !== "user") {
        return NextResponse.json(
          { error: "Modification interdite pour ce rôle." },
          { status: 403 }
        );
      }
      await assertCanAccessCoachUser(actor, userId);
    }

    const { firstName, lastName, password } = body;
    await updateUserProfile(userId, firstName, lastName);
    if (password) {
      await setUserPassword(userId, password);
    }

    await markCoachAction(actor.id);
    await recordAuditEvent({
      actorUserId: actor.id,
      action: "user_profile_updated",
      targetUserId: userId,
      payload: { passwordUpdated: Boolean(password), actorRole: actor.role },
    });
    logServerEvent({
      category: "admin",
      action: "user_profile_updated",
      meta: {
        actorUserId: actor.id,
        targetUserId: userId,
        actorRole: actor.role,
        passwordUpdated: Boolean(password),
      },
    });

    return NextResponse.json({ ok: true });
  }
);

export const DELETE = withSessionHandler(
  { access: "admin", fallbackMessage: "Suppression utilisateur impossible." },
  async ({ user: admin, params }) => {
    const userId = parseRouteId(params.userId as string);
    if (!userId) {
      return NextResponse.json({ error: "Utilisateur invalide." }, { status: 400 });
    }

    if (userId === admin.id) {
      return NextResponse.json(
        { error: "Suppression de votre propre compte admin impossible." },
        { status: 400 }
      );
    }

    await ensureDatabase();
    const targetResult = await db.query<{ role: UserRole; email: string }>(
      `SELECT role, email FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );
    const target = targetResult.rows[0];
    if (!target) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    await assertNoActiveUserLegalHold(userId);
    await deleteUserAccount(userId);
    await markCoachAction(admin.id);
    await recordAuditEvent({
      actorUserId: admin.id,
      action: "user_deleted",
      payload: {
        deletedUserId: userId,
        deletedUserEmail: target.email,
        deletedUserRole: target.role,
      },
    });
    logServerEvent({
      category: "admin",
      action: "user_deleted",
      meta: {
        actorUserId: admin.id,
        deletedUserId: userId,
        deletedUserEmail: target.email,
        deletedUserRole: target.role,
      },
    });

    return NextResponse.json({ ok: true });
  }
);
