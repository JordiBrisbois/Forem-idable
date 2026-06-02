import { and, desc, eq, isNull } from "drizzle-orm";
import type { AuthUser } from "@/types/auth";
import { deleteUserAccount } from "@/lib/server/auth";
import { recordAuditEvent, anonymizeAuditLogsForUser } from "@/lib/server/auditLog";
import { db, ensureDatabase, orm } from "@/lib/server/db";
import { logServerEvent } from "@/lib/server/observability";
import { accountDeletionRequests, users } from "@/lib/server/schema";
import {
  mapAdminDeletionRequestSummary,
  mapDeletionRequestSummary,
  normalizeDeletionStatus,
  type AdminAccountDeletionRequestSummary,
  type AccountDeletionRequestSummary,
} from "@/lib/server/compliance/shared";
import { assertNoActiveUserLegalHold } from "@/lib/server/compliance/legalHolds";

export async function listAccountDeletionRequests(
  userId: number
): Promise<AccountDeletionRequestSummary[]> {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const result = await orm
    .select({
      id: accountDeletionRequests.id,
      status: accountDeletionRequests.status,
      reason: accountDeletionRequests.reason,
      requested_at: accountDeletionRequests.requestedAt,
      reviewed_at: accountDeletionRequests.reviewedAt,
      completed_at: accountDeletionRequests.completedAt,
      cancelled_at: accountDeletionRequests.cancelledAt,
      review_note: accountDeletionRequests.reviewNote,
    })
    .from(accountDeletionRequests)
    .where(eq(accountDeletionRequests.userId, userId))
    .orderBy(desc(accountDeletionRequests.requestedAt))
    .limit(10);

  return result.map(mapDeletionRequestSummary);
}

export async function listAccountDeletionRequestsForAdmin(
  limit = 50
): Promise<AdminAccountDeletionRequestSummary[]> {
  await ensureDatabase();
  const result = await db.query<{
    id: number;
    status: string;
    reason: string | null;
    requested_at: Date | string;
    reviewed_at: Date | string | null;
    completed_at: Date | string | null;
    cancelled_at: Date | string | null;
    review_note: string | null;
    user_id: number;
    user_email: string;
    user_first_name: string;
    user_last_name: string;
    user_role: string;
  }>(
    `SELECT r.id, r.status, r.reason, r.requested_at, r.reviewed_at, r.completed_at,
            r.cancelled_at, r.review_note,
            u.id AS user_id, u.email AS user_email, u.first_name AS user_first_name,
            u.last_name AS user_last_name, u.role AS user_role
     FROM account_deletion_requests r
     INNER JOIN users u ON u.id = r.user_id
     ORDER BY r.requested_at DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows.map(mapAdminDeletionRequestSummary);
}

export async function reviewAccountDeletionRequest(input: {
  requestId: number;
  action: "approve" | "reject" | "complete";
  reviewNote?: string;
  actor: AuthUser;
}) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const [request] = await orm
    .select({
      id: accountDeletionRequests.id,
      userId: accountDeletionRequests.userId,
      status: accountDeletionRequests.status,
      user_email: users.email,
      user_first_name: users.firstName,
      user_last_name: users.lastName,
      user_role: users.role,
    })
    .from(accountDeletionRequests)
    .innerJoin(users, eq(users.id, accountDeletionRequests.userId))
    .where(eq(accountDeletionRequests.id, input.requestId))
    .limit(1);

  if (!request) {
    const error = new Error("Demande introuvable.");
    error.name = "DeletionRequestNotFoundError";
    throw error;
  }

  const normalizedStatus = normalizeDeletionStatus(request.status);
  const reviewNote = input.reviewNote?.trim() || null;

  if (input.action === "approve") {
    if (normalizedStatus !== "pending") {
      const error = new Error("Seules les demandes en attente peuvent être approuvées.");
      error.name = "DeletionRequestStatusError";
      throw error;
    }

    const [updated] = await orm
      .update(accountDeletionRequests)
      .set({
        status: "approved",
        reviewedAt: new Date(),
        reviewedByUserId: input.actor.id,
        reviewNote,
      })
      .where(eq(accountDeletionRequests.id, request.id))
      .returning({
        id: accountDeletionRequests.id,
        status: accountDeletionRequests.status,
        reason: accountDeletionRequests.reason,
        requested_at: accountDeletionRequests.requestedAt,
        reviewed_at: accountDeletionRequests.reviewedAt,
        completed_at: accountDeletionRequests.completedAt,
        cancelled_at: accountDeletionRequests.cancelledAt,
        review_note: accountDeletionRequests.reviewNote,
      });

    await recordAuditEvent({
      actorUserId: input.actor.id,
      action: "account_deletion_approved",
      targetUserId: request.userId,
      payload: {
        requestId: request.id,
      },
    });

    return {
      request: mapAdminDeletionRequestSummary({
        ...updated,
        user_id: request.userId,
        user_email: request.user_email,
        user_first_name: request.user_first_name,
        user_last_name: request.user_last_name,
        user_role: request.user_role,
      }),
      deletedUserId: null,
    };
  }

  if (input.action === "reject") {
    if (normalizedStatus !== "pending") {
      const error = new Error("Seules les demandes en attente peuvent être refusées.");
      error.name = "DeletionRequestStatusError";
      throw error;
    }

    const [updated] = await orm
      .update(accountDeletionRequests)
      .set({
        status: "rejected",
        reviewedAt: new Date(),
        reviewedByUserId: input.actor.id,
        reviewNote,
      })
      .where(eq(accountDeletionRequests.id, request.id))
      .returning({
        id: accountDeletionRequests.id,
        status: accountDeletionRequests.status,
        reason: accountDeletionRequests.reason,
        requested_at: accountDeletionRequests.requestedAt,
        reviewed_at: accountDeletionRequests.reviewedAt,
        completed_at: accountDeletionRequests.completedAt,
        cancelled_at: accountDeletionRequests.cancelledAt,
        review_note: accountDeletionRequests.reviewNote,
      });

    await recordAuditEvent({
      actorUserId: input.actor.id,
      action: "account_deletion_rejected",
      targetUserId: request.userId,
      payload: {
        requestId: request.id,
      },
    });

    return {
      request: mapAdminDeletionRequestSummary({
        ...updated,
        user_id: request.userId,
        user_email: request.user_email,
        user_first_name: request.user_first_name,
        user_last_name: request.user_last_name,
        user_role: request.user_role,
      }),
      deletedUserId: null,
    };
  }

  if (normalizedStatus !== "approved") {
    const error = new Error("Seules les demandes approuvées peuvent être finalisées.");
    error.name = "DeletionRequestStatusError";
    throw error;
  }

  await assertNoActiveUserLegalHold(request.userId);

  await orm
    .update(accountDeletionRequests)
    .set({
      status: "completed",
      completedAt: new Date(),
      reviewedAt: new Date(),
      reviewedByUserId: input.actor.id,
      reviewNote,
    })
    .where(eq(accountDeletionRequests.id, request.id));

  await recordAuditEvent({
    actorUserId: input.actor.id,
    action: "account_deletion_completed",
    targetUserId: request.userId,
    payload: {
      requestId: request.id,
    },
  });

  await anonymizeAuditLogsForUser(request.userId);
  await deleteUserAccount(request.userId);

  return {
    request: null,
    deletedUserId: request.userId,
  };
}

export async function createAccountDeletionRequest(user: AuthUser, reason?: string) {
  await assertNoActiveUserLegalHold(user.id);
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const [pending] = await orm
    .select({ id: accountDeletionRequests.id })
    .from(accountDeletionRequests)
    .where(
      and(
        eq(accountDeletionRequests.userId, user.id),
        eq(accountDeletionRequests.status, "pending"),
        isNull(accountDeletionRequests.cancelledAt)
      )
    )
    .limit(1);

  if (pending) {
    const error = new Error("Une demande de suppression est déjà en attente.");
    error.name = "DuplicateDeletionRequestError";
    throw error;
  }

  const [created] = await orm
    .insert(accountDeletionRequests)
    .values({
      userId: user.id,
      status: "pending",
      reason: reason?.trim() || null,
    })
    .returning({
      id: accountDeletionRequests.id,
      status: accountDeletionRequests.status,
      reason: accountDeletionRequests.reason,
      requested_at: accountDeletionRequests.requestedAt,
      reviewed_at: accountDeletionRequests.reviewedAt,
      completed_at: accountDeletionRequests.completedAt,
      cancelled_at: accountDeletionRequests.cancelledAt,
      review_note: accountDeletionRequests.reviewNote,
    });

  await recordAuditEvent({
    actorUserId: user.id,
    action: "account_deletion_requested",
    targetUserId: user.id,
    payload: {
      requestId: created?.id,
    },
  });

  logServerEvent({
    category: "compliance",
    action: "account_deletion_requested",
    meta: {
      actorUserId: user.id,
      requestId: created?.id,
    },
  });

  return mapDeletionRequestSummary(created);
}

export async function cancelPendingAccountDeletionRequest(user: AuthUser) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const [pending] = await orm
    .select({ id: accountDeletionRequests.id })
    .from(accountDeletionRequests)
    .where(
      and(
        eq(accountDeletionRequests.userId, user.id),
        eq(accountDeletionRequests.status, "pending"),
        isNull(accountDeletionRequests.cancelledAt)
      )
    )
    .orderBy(desc(accountDeletionRequests.requestedAt))
    .limit(1);

  if (!pending) {
    return null;
  }

  const [row] = await orm
    .update(accountDeletionRequests)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
    })
    .where(eq(accountDeletionRequests.id, pending.id))
    .returning({
      id: accountDeletionRequests.id,
      status: accountDeletionRequests.status,
      reason: accountDeletionRequests.reason,
      requested_at: accountDeletionRequests.requestedAt,
      reviewed_at: accountDeletionRequests.reviewedAt,
      completed_at: accountDeletionRequests.completedAt,
      cancelled_at: accountDeletionRequests.cancelledAt,
      review_note: accountDeletionRequests.reviewNote,
    });

  if (!row) {
    return null;
  }

  await recordAuditEvent({
    actorUserId: user.id,
    action: "account_deletion_cancelled",
    targetUserId: user.id,
    payload: {
      requestId: row.id,
    },
  });

  logServerEvent({
    category: "compliance",
    action: "account_deletion_cancelled",
    meta: {
      actorUserId: user.id,
      requestId: row.id,
    },
  });

  return mapDeletionRequestSummary(row);
}
