export type DataExportRequestStatus = "pending" | "completed" | "failed";
export type AccountDeletionRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "completed"
  | "cancelled";
export type LegalHoldTargetType = "user" | "conversation" | "application";

export type DataExportRequestSummary = {
  id: number;
  status: DataExportRequestStatus;
  format: string;
  createdAt: string;
  completedAt: string | null;
  expiresAt: string | null;
  error: string | null;
};

export type AccountDeletionRequestSummary = {
  id: number;
  status: AccountDeletionRequestStatus;
  reason: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  reviewNote: string | null;
};

export type LegalHoldSummary = {
  id: number;
  targetType: LegalHoldTargetType;
  targetId: number;
  reason: string;
  createdAt: string;
  releasedAt: string | null;
};

export type AdminAccountDeletionRequestSummary = AccountDeletionRequestSummary & {
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
};

export function toIso(value: Date | string | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export function normalizeDataExportStatus(status: string): DataExportRequestStatus {
  return status === "completed" || status === "failed" ? status : "pending";
}

export function normalizeDeletionStatus(status: string): AccountDeletionRequestStatus {
  return status === "approved" ||
    status === "rejected" ||
    status === "completed" ||
    status === "cancelled"
    ? status
    : "pending";
}

export function normalizeLegalHoldTargetType(targetType: string): LegalHoldTargetType {
  return targetType === "conversation" || targetType === "application" ? targetType : "user";
}

export function mapDataExportSummary(row: {
  id: number;
  status: string;
  format: string;
  created_at: Date | string;
  completed_at: Date | string | null;
  expires_at: Date | string | null;
  error: string | null;
}): DataExportRequestSummary {
  return {
    id: row.id,
    status: normalizeDataExportStatus(row.status),
    format: row.format,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    completedAt: toIso(row.completed_at),
    expiresAt: toIso(row.expires_at),
    error: row.error,
  };
}

export function mapDeletionRequestSummary(row: {
  id: number;
  status: string;
  reason: string | null;
  requested_at: Date | string;
  reviewed_at: Date | string | null;
  completed_at: Date | string | null;
  cancelled_at: Date | string | null;
  review_note: string | null;
}): AccountDeletionRequestSummary {
  return {
    id: row.id,
    status: normalizeDeletionStatus(row.status),
    reason: row.reason,
    requestedAt: toIso(row.requested_at) ?? new Date().toISOString(),
    reviewedAt: toIso(row.reviewed_at),
    completedAt: toIso(row.completed_at),
    cancelledAt: toIso(row.cancelled_at),
    reviewNote: row.review_note,
  };
}

export function mapLegalHoldSummary(row: {
  id: number;
  target_type: string;
  target_id: number;
  reason: string;
  created_at: Date | string;
  released_at: Date | string | null;
}): LegalHoldSummary {
  return {
    id: row.id,
    targetType: normalizeLegalHoldTargetType(row.target_type),
    targetId: row.target_id,
    reason: row.reason,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    releasedAt: toIso(row.released_at),
  };
}

export function mapAdminDeletionRequestSummary(row: {
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
}): AdminAccountDeletionRequestSummary {
  return {
    ...mapDeletionRequestSummary(row),
    user: {
      id: row.user_id,
      email: row.user_email,
      firstName: row.user_first_name,
      lastName: row.user_last_name,
      role: row.user_role,
    },
  };
}
