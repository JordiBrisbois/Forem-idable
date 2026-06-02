import { and, desc, eq, isNull } from "drizzle-orm";
import { recordAuditEvent } from "@/lib/server/auditLog";
import { ensureDatabase, orm } from "@/lib/server/db";
import { legalHolds } from "@/lib/server/schema";
import {
  type LegalHoldSummary,
  type LegalHoldTargetType,
  mapLegalHoldSummary,
} from "@/lib/server/compliance/shared";

export async function getActiveLegalHold(targetType: LegalHoldTargetType, targetId: number) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const [row] = await orm
    .select({
      id: legalHolds.id,
      target_type: legalHolds.targetType,
      target_id: legalHolds.targetId,
      reason: legalHolds.reason,
      created_at: legalHolds.createdAt,
      released_at: legalHolds.releasedAt,
    })
    .from(legalHolds)
    .where(
      and(
        eq(legalHolds.targetType, targetType),
        eq(legalHolds.targetId, targetId),
        isNull(legalHolds.releasedAt)
      )
    )
    .orderBy(desc(legalHolds.createdAt))
    .limit(1);

  return row ? mapLegalHoldSummary(row) : null;
}

export async function assertNoActiveUserLegalHold(userId: number) {
  const hold = await getActiveLegalHold("user", userId);
  if (hold) {
    const error = new Error("Compte gelé pour conservation légale. Action impossible.");
    error.name = "ActiveLegalHoldError";
    throw error;
  }
}

export async function createLegalHold(input: {
  actorUserId: number;
  targetType: LegalHoldTargetType;
  targetId: number;
  reason: string;
}) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const existing = await getActiveLegalHold(input.targetType, input.targetId);
  if (existing) {
    return existing;
  }

  const [created] = await orm
    .insert(legalHolds)
    .values({
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason.trim(),
      createdByUserId: input.actorUserId,
    })
    .returning({
      id: legalHolds.id,
      target_type: legalHolds.targetType,
      target_id: legalHolds.targetId,
      reason: legalHolds.reason,
      created_at: legalHolds.createdAt,
      released_at: legalHolds.releasedAt,
    });

  await recordAuditEvent({
    actorUserId: input.actorUserId,
    action: "legal_hold_created",
    targetUserId: input.targetType === "user" ? input.targetId : null,
    payload: {
      legalHoldId: created?.id,
      targetType: input.targetType,
      targetId: input.targetId,
    },
  });

  return mapLegalHoldSummary(created);
}

export async function releaseLegalHold(id: number, actorUserId: number) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const [row] = await orm
    .update(legalHolds)
    .set({ releasedAt: new Date() })
    .where(and(eq(legalHolds.id, id), isNull(legalHolds.releasedAt)))
    .returning({
      id: legalHolds.id,
      target_type: legalHolds.targetType,
      target_id: legalHolds.targetId,
      reason: legalHolds.reason,
      created_at: legalHolds.createdAt,
      released_at: legalHolds.releasedAt,
    });

  if (!row) {
    return null;
  }

  await recordAuditEvent({
    actorUserId,
    action: "legal_hold_released",
    targetUserId: row.target_type === "user" ? row.target_id : null,
    payload: {
      legalHoldId: row.id,
      targetType: row.target_type,
      targetId: row.target_id,
    },
  });

  return mapLegalHoldSummary(row);
}

export async function listActiveLegalHolds(limit = 50): Promise<LegalHoldSummary[]> {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const result = await orm
    .select({
      id: legalHolds.id,
      target_type: legalHolds.targetType,
      target_id: legalHolds.targetId,
      reason: legalHolds.reason,
      created_at: legalHolds.createdAt,
      released_at: legalHolds.releasedAt,
    })
    .from(legalHolds)
    .where(isNull(legalHolds.releasedAt))
    .orderBy(desc(legalHolds.createdAt))
    .limit(limit);

  return result.map(mapLegalHoldSummary);
}
