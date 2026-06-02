import { NextRequest, NextResponse } from "next/server";
import { recordAuditEvent } from "@/lib/server/auditLog";
import { assertNoActiveUserLegalHold } from "@/lib/server/compliance";
import { db, ensureDatabase } from "@/lib/server/db";
import { deleteUserAccount, setUserPassword, updateUserProfile } from "@/lib/server/auth";
import {
  assertCanAccessCoachUser,
  markCoachAction,
  requireAdminAccess,
  requireCoachAccess,
} from "@/lib/server/coach";
import { logServerEvent, withRequestContext } from "@/lib/server/observability";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import {
  managedUserUpdateSchema,
  parseIntegerParam,
  readValidatedJson,
} from "@/lib/server/requestSchemas";
import { UserRole } from "@/types/auth";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  return withRequestContext(request, async () => {
    try {
      const forbidden = rejectCrossOriginRequest(request);
      if (forbidden) return forbidden;

      const actor = await requireCoachAccess();
      if (!actor) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { userId: rawUserId } = await context.params;
      const userId = parseIntegerParam(rawUserId);
      if (!userId) {
        return NextResponse.json({ error: "Utilisateur invalide." }, { status: 400 });
      }

      const parsed = await readValidatedJson(request, managedUserUpdateSchema);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }

      await ensureDatabase();

      const targetResult = await db.query<{ role: UserRole; email: string }>(
        `SELECT role, email
         FROM users
         WHERE id = $1
         LIMIT 1`,
        [userId]
      );

      const target = targetResult.rows[0];
      if (!target) {
        return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
      }

      if (actor.role !== "admin") {
        if (target.role !== "user") {
          return NextResponse.json({ error: "Modification interdite pour ce rôle." }, { status: 403 });
        }

        await assertCanAccessCoachUser(actor, userId);
      }

      const { firstName, lastName, password } = parsed.data;
      await updateUserProfile(userId, firstName, lastName);

      if (password) {
        await setUserPassword(userId, password);
      }

      await markCoachAction(actor.id);
      await recordAuditEvent({
        actorUserId: actor.id,
        action: "user_profile_updated",
        targetUserId: userId,
        payload: {
          passwordUpdated: Boolean(password),
          actorRole: actor.role,
        },
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
    } catch (error) {
      if (error instanceof Error && error.message === "Forbidden") {
        return NextResponse.json(
          { error: "Modification interdite pour ce périmètre." },
          { status: 403 }
        );
      }

      return NextResponse.json({ error: "Mise à jour utilisateur impossible." }, { status: 500 });
    }
  });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  return withRequestContext(request, async () => {
    try {
      const forbidden = rejectCrossOriginRequest(request);
      if (forbidden) return forbidden;

      const admin = await requireAdminAccess();
      if (!admin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { userId: rawUserId } = await context.params;
      const userId = parseIntegerParam(rawUserId);
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
        `SELECT role, email
         FROM users
         WHERE id = $1
         LIMIT 1`,
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
    } catch (error) {
      if (error instanceof Error && error.name === "ActiveLegalHoldError") {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }

      return NextResponse.json({ error: "Suppression utilisateur impossible." }, { status: 500 });
    }
  });
}
