import { desc } from "drizzle-orm";
import { recordAuditEvent } from "@/lib/server/auditLog";
import { ensureDatabase, orm } from "@/lib/server/db";
import { disclosureLogs } from "@/lib/server/schema";
import { toIso } from "@/lib/server/compliance/shared";

export async function createDisclosureLog(input: {
  actorUserId: number;
  requestType: "authority_request" | "litigation" | "other";
  authorityName: string;
  legalBasis?: string;
  targetType: "user" | "conversation" | "application" | "export" | "other";
  targetId?: number;
  scopeSummary: string;
  exportReference?: string;
}) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const [created] = await orm
    .insert(disclosureLogs)
    .values({
      requestType: input.requestType,
      authorityName: input.authorityName.trim(),
      legalBasis: input.legalBasis?.trim() || null,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      scopeSummary: input.scopeSummary.trim(),
      exportReference: input.exportReference?.trim() || null,
      createdByUserId: input.actorUserId,
    })
    .returning({
      id: disclosureLogs.id,
      created_at: disclosureLogs.createdAt,
    });

  await recordAuditEvent({
    actorUserId: input.actorUserId,
    action: "disclosure_logged",
    targetUserId: input.targetType === "user" ? input.targetId ?? null : null,
    payload: {
      disclosureLogId: created?.id,
      requestType: input.requestType,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
    },
  });

  return {
    id: created?.id ?? 0,
    createdAt: toIso(created?.created_at) ?? new Date().toISOString(),
  };
}

export async function listDisclosureLogs(limit = 50) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const result = await orm
    .select({
      id: disclosureLogs.id,
      request_type: disclosureLogs.requestType,
      authority_name: disclosureLogs.authorityName,
      legal_basis: disclosureLogs.legalBasis,
      target_type: disclosureLogs.targetType,
      target_id: disclosureLogs.targetId,
      scope_summary: disclosureLogs.scopeSummary,
      export_reference: disclosureLogs.exportReference,
      created_by_user_id: disclosureLogs.createdByUserId,
      created_at: disclosureLogs.createdAt,
    })
    .from(disclosureLogs)
    .orderBy(desc(disclosureLogs.createdAt))
    .limit(limit);

  return result.map((row) => ({
    id: row.id,
    requestType: row.request_type,
    authorityName: row.authority_name,
    legalBasis: row.legal_basis,
    targetType: row.target_type,
    targetId: row.target_id,
    scopeSummary: row.scope_summary,
    exportReference: row.export_reference,
    createdByUserId: row.created_by_user_id,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
  }));
}
