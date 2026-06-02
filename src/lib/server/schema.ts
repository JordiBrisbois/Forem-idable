import { sql } from "drizzle-orm";
import {
  boolean,
  bigint,
  bigserial,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { UserRole } from "@/types/auth";

/** Core user accounts with role-based access control (user / coach / admin). */
export const users = pgTable("users", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  role: text("role").$type<UserRole>().notNull().default("user"),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  lastCoachActionAt: timestamp("last_coach_action_at", { withTimezone: true }),
  trackingPhase: text("tracking_phase").notNull().default("job_search"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Session tokens with hashed storage, expiry, and cascade on user deletion. */
export const sessions = pgTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("sessions_user_id_idx").on(table.userId),
    expiresAtIdx: index("sessions_expires_at_idx").on(table.expiresAt),
  })
);

/** Per-user job preferences and UI state persisted as JSONB. */
export const userState = pgTable("user_state", {
  userId: bigint("user_id", { mode: "number" })
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Saved job bookmarks (pre-selection pipeline, distinct from tracked applications). */
export const userFavorites = pgTable(
  "user_favorites",
  {
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobId: text("job_id").notNull(),
    position: integer("position").notNull().default(0),
    job: jsonb("job").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.jobId] }),
    userPositionIdx: index("user_favorites_user_position_idx").on(table.userId, table.position),
  })
);

/** Tracked job applications with follow-up scheduling, interview details, and soft-delete (archive). */
export const applications = pgTable(
  "applications",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobId: text("job_id").notNull(),
    position: integer("position").notNull().default(0),
    status: text("status").notNull(),
    appliedAt: timestamp("applied_at", { withTimezone: true }).notNull(),
    followUpDueAt: timestamp("follow_up_due_at", { withTimezone: true }),
    followUpEnabled: boolean("follow_up_enabled").notNull().default(true),
    lastFollowUpAt: timestamp("last_follow_up_at", { withTimezone: true }),
    interviewAt: timestamp("interview_at", { withTimezone: true }),
    interviewDetails: text("interview_details"),
    beneficiaryNotes: text("beneficiary_notes"),
    proofs: text("proofs"),
    sourceType: text("source_type").notNull().default("tracked"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => ({
    userJobIdx: index("applications_user_job_idx").on(table.userId, table.jobId),
    userStatusIdx: index("applications_user_status_idx").on(table.userId, table.status),
    userPositionIdx: index("applications_user_position_idx").on(table.userId, table.position),
    followUpDueIdx: index("applications_follow_up_due_idx").on(table.followUpDueAt),
    updatedAtIdx: index("applications_updated_at_idx").on(table.updatedAt),
    userJobUnique: uniqueIndex("applications_user_job_unique").on(table.userId, table.jobId),
  })
);

/** Job metadata (title, company, URL, etc.) for each application. One-to-one with applications. */
export const applicationJobs = pgTable(
  "application_jobs",
  {
    applicationId: bigint("application_id", { mode: "number" })
      .primaryKey()
      .references(() => applications.id, { onDelete: "cascade" }),
    provider: text("provider"),
    externalJobId: text("external_job_id"),
    title: text("title").notNull(),
    company: text("company"),
    location: text("location"),
    contractType: text("contract_type"),
    url: text("url"),
    publicationDate: timestamp("publication_date", { withTimezone: true }),
    pdfUrl: text("pdf_url"),
    description: text("description"),
    rawPayload: jsonb("raw_payload"),
  },
  (table) => ({
    providerExternalJobIdx: index("application_jobs_provider_external_job_idx").on(
      table.provider,
      table.externalJobId
    ),
    companyIdx: index("application_jobs_company_idx").on(table.company),
    titleIdx: index("application_jobs_title_idx").on(table.title),
  })
);

/** Coach-only private notes (one per application) with contributor tracking. */
export const applicationPrivateNotes = pgTable(
  "application_private_notes",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    applicationId: bigint("application_id", { mode: "number" })
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdByUserId: bigint("created_by_user_id", { mode: "number" }).references(() => users.id, {
      onDelete: "set null",
    }),
    createdByFirstName: text("created_by_first_name").notNull().default(""),
    createdByLastName: text("created_by_last_name").notNull().default(""),
    createdByEmail: text("created_by_email").notNull().default(""),
    createdByRole: text("created_by_role").notNull().default("system"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    isLegacy: boolean("is_legacy").notNull().default(false),
  },
  (table) => ({
    applicationIdx: index("application_private_notes_application_idx").on(table.applicationId),
    applicationUnique: uniqueIndex("application_private_notes_application_unique").on(
      table.applicationId
    ),
  })
);

export const applicationPrivateNoteContributors = pgTable(
  "application_private_note_contributors",
  {
    privateNoteId: bigint("private_note_id", { mode: "number" })
      .notNull()
      .references(() => applicationPrivateNotes.id, { onDelete: "cascade" }),
    userId: bigint("user_id", { mode: "number" }).references(() => users.id, {
      onDelete: "set null",
    }),
    firstName: text("first_name").notNull().default(""),
    lastName: text("last_name").notNull().default(""),
    displayName: text("display_name").notNull(),
    email: text("email"),
    role: text("role").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.privateNoteId, table.displayName, table.role] }),
    userIdIdx: index("application_private_note_contributors_user_id_idx").on(table.userId),
  })
);

/** Shared notes visible to multiple coaches on an application. */
export const applicationSharedNotes = pgTable(
  "application_shared_notes",
  {
    id: text("id").primaryKey(),
    applicationId: bigint("application_id", { mode: "number" })
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdByUserId: bigint("created_by_user_id", { mode: "number" }).references(() => users.id, {
      onDelete: "set null",
    }),
    createdByFirstName: text("created_by_first_name").notNull().default(""),
    createdByLastName: text("created_by_last_name").notNull().default(""),
    createdByEmail: text("created_by_email").notNull().default(""),
    createdByRole: text("created_by_role").notNull().default("system"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    isLegacy: boolean("is_legacy").notNull().default(false),
    visibility: text("visibility").notNull().default("coach_shared"),
  },
  (table) => ({
    applicationUpdatedIdx: index("application_shared_notes_application_updated_idx").on(
      table.applicationId,
      table.updatedAt
    ),
  })
);

export const applicationSharedNoteContributors = pgTable(
  "application_shared_note_contributors",
  {
    sharedNoteId: text("shared_note_id")
      .notNull()
      .references(() => applicationSharedNotes.id, { onDelete: "cascade" }),
    userId: bigint("user_id", { mode: "number" }).references(() => users.id, {
      onDelete: "set null",
    }),
    firstName: text("first_name").notNull().default(""),
    lastName: text("last_name").notNull().default(""),
    displayName: text("display_name").notNull(),
    email: text("email"),
    role: text("role").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.sharedNoteId, table.displayName, table.role] }),
    userIdIdx: index("application_shared_note_contributors_user_id_idx").on(table.userId),
  })
);

/** Immutable audit events for application lifecycle (status changes, notes, interviews). */
export const applicationEvents = pgTable(
  "application_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    applicationId: bigint("application_id", { mode: "number" })
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    actorUserId: bigint("actor_user_id", { mode: "number" }).references(() => users.id, {
      onDelete: "set null",
    }),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    applicationCreatedIdx: index("application_events_application_created_idx").on(
      table.applicationId,
      table.createdAt
    ),
    eventTypeCreatedIdx: index("application_events_event_type_created_idx").on(
      table.eventType,
      table.createdAt
    ),
  })
);

/** Job search session history for autocomplete and recent searches. */
export const userSearchHistory = pgTable(
  "user_search_history",
  {
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entryId: text("entry_id").notNull(),
    position: integer("position").notNull().default(0),
    entry: jsonb("entry").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.entryId] }),
    userPositionIdx: index("user_search_history_user_position_idx").on(table.userId, table.position),
  })
);

/** Admin-curated featured searches displayed on the homepage. */
export const featuredSearches = pgTable(
  "featured_searches",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    ctaLabel: text("cta_label").notNull(),
    query: jsonb("query").notNull().default(sql`'{}'::jsonb`),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    activeSortIdx: index("featured_searches_active_sort_idx").on(table.isActive, table.sortOrder),
    updatedAtIdx: index("featured_searches_updated_at_idx").on(table.updatedAt),
  })
);

/** Per-user settings (theme, analytics consent, cached location data). */
export const userSettings = pgTable("user_settings", {
  userId: bigint("user_id", { mode: "number" })
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  settings: jsonb("settings").notNull().default(sql`'{}'::jsonb`),
  theme: text("theme"),
  analyticsConsent: text("analytics_consent"),
  locationsCache: jsonb("locations_cache"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Coach-managed beneficiary groups with optional archiving and manager assignment. */
export const coachGroups = pgTable(
  "coach_groups",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    name: text("name").notNull(),
    createdBy: bigint("created_by", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    managerCoachUserId: bigint("manager_coach_user_id", { mode: "number" }).references(() => users.id, {
      onDelete: "set null",
    }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    createdByIdx: index("coach_groups_created_by_idx").on(table.createdBy),
    managerCoachUserIdIdx: index("coach_groups_manager_coach_user_id_idx").on(table.managerCoachUserId),
    archivedAtIdx: index("coach_groups_archived_at_idx").on(table.archivedAt),
  })
);

/** Many-to-many link between coach groups and their beneficiary members. */
export const coachGroupMembers = pgTable(
  "coach_group_members",
  {
    groupId: bigint("group_id", { mode: "number" })
      .notNull()
      .references(() => coachGroups.id, { onDelete: "cascade" }),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.groupId, table.userId] }),
    userIdIdx: index("coach_group_members_user_id_idx").on(table.userId),
  })
);

/** Many-to-many link between coach groups and assigned coaches. */
export const coachGroupCoaches = pgTable(
  "coach_group_coaches",
  {
    groupId: bigint("group_id", { mode: "number" })
      .notNull()
      .references(() => coachGroups.id, { onDelete: "cascade" }),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.groupId, table.userId] }),
    userIdIdx: index("coach_group_coaches_user_id_idx").on(table.userId),
  })
);

/** Historical tracking phase transitions for beneficiary lifecycle audit. */
export const userTrackingPhases = pgTable(
  "user_tracking_phases",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    phase: text("phase").notNull(),
    reason: text("reason"),
    createdByUserId: bigint("created_by_user_id", { mode: "number" }).references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("user_tracking_phases_user_id_idx").on(table.userId, table.createdAt),
  })
);

/** Messaging conversations (group-chat via coachGroupId or 1:1 via direct). */
export const conversations = pgTable(
  "conversations",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    type: text("type").notNull().default("group"),
    groupId: bigint("group_id", { mode: "number" }).references(() => coachGroups.id, {
      onDelete: "cascade",
    }),
    directUserAId: bigint("direct_user_a_id", { mode: "number" }).references(() => users.id, {
      onDelete: "cascade",
    }),
    directUserBId: bigint("direct_user_b_id", { mode: "number" }).references(() => users.id, {
      onDelete: "cascade",
    }),
    createdByUserId: bigint("created_by_user_id", { mode: "number" }).references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    typeLastMessageIdx: index("conversations_type_last_message_idx").on(
      table.type,
      table.lastMessageAt
    ),
    groupUnique: uniqueIndex("conversations_group_unique").on(table.groupId),
    directPairUnique: uniqueIndex("conversations_direct_pair_unique").on(
      table.type,
      table.directUserAId,
      table.directUserBId
    ),
  })
);

export const conversationParticipants = pgTable(
  "conversation_participants",
  {
    conversationId: bigint("conversation_id", { mode: "number" })
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleSnapshot: text("role_snapshot").notNull().default("user"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    leftAt: timestamp("left_at", { withTimezone: true }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.conversationId, table.userId] }),
    userIdx: index("conversation_participants_user_idx").on(table.userId, table.leftAt),
  })
);

/** Messages within a conversation with content sanitization (XSS via escapeHtml). */
export const conversationMessages = pgTable(
  "conversation_messages",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    conversationId: bigint("conversation_id", { mode: "number" })
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    authorUserId: bigint("author_user_id", { mode: "number" }).references(() => users.id, {
      onDelete: "set null",
    }),
    type: text("type").notNull().default("text"),
    content: text("content"),
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    editedAt: timestamp("edited_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    conversationCreatedIdx: index("conversation_messages_conversation_created_idx").on(
      table.conversationId,
      table.createdAt
    ),
    authorIdx: index("conversation_messages_author_idx").on(table.authorUserId),
  })
);

/** Read receipts per user per conversation for unread message count. */
export const conversationReads = pgTable(
  "conversation_reads",
  {
    conversationId: bigint("conversation_id", { mode: "number" })
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastReadMessageId: bigint("last_read_message_id", { mode: "number" }).references(
      () => conversationMessages.id,
      { onDelete: "set null" }
    ),
    lastReadAt: timestamp("last_read_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.conversationId, table.userId] }),
    userIdx: index("conversation_reads_user_idx").on(table.userId, table.lastReadAt),
  })
);

/** HMAC-signed API keys for external partner access (coach/admin only). */
export const apiKeys = pgTable(
  "api_keys",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    keyPrefix: text("key_prefix").notNull(),
    lastFour: text("last_four").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index("api_keys_user_id_idx").on(table.userId),
    activeIdx: index("api_keys_active_idx").on(table.userId, table.revokedAt),
  })
);

/** Time-limited password reset tokens with expiry. */
export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("password_reset_tokens_user_id_idx").on(table.userId),
    expiresAtIdx: index("password_reset_tokens_expires_at_idx").on(table.expiresAt),
  })
);

/** ICS calendar feed subscriptions for coach groups and global calendars. */
export const calendarSubscriptions = pgTable(
  "calendar_subscriptions",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    scope: text("scope").notNull().default("group"),
    groupId: bigint("group_id", { mode: "number" }).references(() => coachGroups.id, {
      onDelete: "cascade",
    }),
    tokenHash: text("token_hash").notNull().unique(),
    keyPrefix: text("key_prefix").notNull().default(""),
    lastFour: text("last_four").notNull().default(""),
    createdBy: bigint("created_by", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => ({
    scopeGroupIdx: index("calendar_subscriptions_scope_group_idx").on(
      table.scope,
      table.groupId,
      table.revokedAt
    ),
    createdByIdx: index("calendar_subscriptions_created_by_idx").on(table.createdBy),
  })
);

/** Audit trail for admin/coach actions, GDPR exports, and security events. */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    actorUserId: bigint("actor_user_id", { mode: "number" }).references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    targetUserId: bigint("target_user_id", { mode: "number" }).references(() => users.id, {
      onDelete: "set null",
    }),
    groupId: bigint("group_id", { mode: "number" }).references(() => coachGroups.id, {
      onDelete: "set null",
    }),
    payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    actorUserIdIdx: index("audit_logs_actor_user_id_idx").on(table.actorUserId),
    targetUserIdIdx: index("audit_logs_target_user_id_idx").on(table.targetUserId),
    groupIdIdx: index("audit_logs_group_id_idx").on(table.groupId),
    actionIdx: index("audit_logs_action_idx").on(table.action, table.createdAt),
  })
);

/** GDPR data export requests with status tracking and expiry. */
export const dataExportRequests = pgTable(
  "data_export_requests",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    format: text("format").notNull().default("json"),
    payload: jsonb("payload"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (table) => ({
    userCreatedIdx: index("data_export_requests_user_created_idx").on(table.userId, table.createdAt),
    userStatusIdx: index("data_export_requests_user_status_idx").on(table.userId, table.status),
    expiresAtIdx: index("data_export_requests_expires_at_idx").on(table.expiresAt),
  })
);

/** GDPR account deletion requests with admin review workflow. */
export const accountDeletionRequests = pgTable(
  "account_deletion_requests",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    reason: text("reason"),
    requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedByUserId: bigint("reviewed_by_user_id", { mode: "number" }).references(() => users.id, {
      onDelete: "set null",
    }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    reviewNote: text("review_note"),
  },
  (table) => ({
    userRequestedIdx: index("account_deletion_requests_user_requested_idx").on(
      table.userId,
      table.requestedAt
    ),
    userStatusIdx: index("account_deletion_requests_user_status_idx").on(table.userId, table.status),
  })
);

/** Legal holds blocking deletion/purge for users, conversations, or applications. */
export const legalHolds = pgTable(
  "legal_holds",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    targetType: text("target_type").notNull(),
    targetId: bigint("target_id", { mode: "number" }).notNull(),
    reason: text("reason").notNull(),
    createdByUserId: bigint("created_by_user_id", { mode: "number" }).references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    releasedAt: timestamp("released_at", { withTimezone: true }),
  },
  (table) => ({
    targetIdx: index("legal_holds_target_idx").on(table.targetType, table.targetId, table.releasedAt),
    createdByIdx: index("legal_holds_created_by_idx").on(table.createdByUserId),
  })
);

/** Log of authorized data disclosures to authorities (GDPR compliance). */
export const disclosureLogs = pgTable(
  "disclosure_logs",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    requestType: text("request_type").notNull().default("authority_request"),
    authorityName: text("authority_name").notNull(),
    legalBasis: text("legal_basis"),
    targetType: text("target_type").notNull(),
    targetId: bigint("target_id", { mode: "number" }),
    scopeSummary: text("scope_summary").notNull(),
    exportReference: text("export_reference"),
    payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
    createdByUserId: bigint("created_by_user_id", { mode: "number" }).references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    requestTypeCreatedIdx: index("disclosure_logs_request_type_created_idx").on(
      table.requestType,
      table.createdAt
    ),
    targetIdx: index("disclosure_logs_target_idx").on(table.targetType, table.targetId),
    createdByIdx: index("disclosure_logs_created_by_idx").on(table.createdByUserId),
  })
);

/** Scout discovery jobs (Overpass API + email scraping) with status tracking. */
export const scoutJobs = pgTable(
  "scout_jobs",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    query: text("query").notNull(),
    lat: text("lat").notNull(),
    lon: text("lon").notNull(),
    radius: integer("radius").notNull(),
    categories: jsonb("categories").notNull().default(sql`'[]'::jsonb`),
    scrapeEmails: boolean("scrape_emails").notNull().default(false),
    totalSteps: integer("total_steps").notNull().default(0),
    completedSteps: integer("completed_steps").notNull().default(0),
    resultCount: integer("result_count").notNull().default(0),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => ({
    userStatusIdx: index("scout_jobs_user_status_idx").on(table.userId, table.status),
    createdAtIdx: index("scout_jobs_created_at_idx").on(table.createdAt),
  })
);

/** Scout result rows (discovered companies/emails) linked to a scout job. */
export const scoutResults = pgTable(
  "scout_results",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    jobId: bigint("job_id", { mode: "number" })
      .notNull()
      .references(() => scoutJobs.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type").notNull().default("?"),
    email: text("email"),
    website: text("website"),
    phone: text("phone"),
    address: text("address"),
    lat: text("lat"),
    lon: text("lon"),
    town: text("town"),
    emailSource: text("email_source").notNull().default(""),
    allEmails: jsonb("all_emails").notNull().default(sql`'[]'::jsonb`),
    osmId: bigint("osm_id", { mode: "number" }),
  },
  (table) => ({
    jobIdIdx: index("scout_results_job_id_idx").on(table.jobId),
    emailIdx: index("scout_results_email_idx").on(table.email),
    osmIdIdx: index("scout_results_osm_id_idx").on(table.osmId),
  })
);

/** Cached company contact data from email scraping (deduped by OSM ID). */
export const companyCache = pgTable(
  "company_cache",
  {
    osmId: bigint("osm_id", { mode: "number" }).primaryKey(),
    name: text("name").notNull(),
    type: text("type").notNull().default("?"),
    email: text("email"),
    website: text("website"),
    phone: text("phone"),
    address: text("address"),
    lat: text("lat"),
    lon: text("lon"),
    town: text("town"),
    emailSource: text("email_source").notNull().default(""),
    allEmails: jsonb("all_emails").notNull().default(sql`'[]'::jsonb`),
    scrapedAt: timestamp("scraped_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    websiteIdx: index("company_cache_website_idx").on(table.website),
    scrapedAtIdx: index("company_cache_scraped_at_idx").on(table.scrapedAt),
  })
);
