CREATE TABLE "application_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"application_id" bigint NOT NULL,
	"actor_user_id" bigint,
	"event_type" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_jobs" (
	"application_id" bigint PRIMARY KEY NOT NULL,
	"provider" text,
	"external_job_id" text,
	"title" text NOT NULL,
	"company" text,
	"location" text,
	"contract_type" text,
	"url" text,
	"publication_date" timestamp with time zone,
	"pdf_url" text,
	"description" text,
	"raw_payload" jsonb
);
--> statement-breakpoint
CREATE TABLE "application_private_note_contributors" (
	"private_note_id" bigint NOT NULL,
	"user_id" bigint,
	"first_name" text DEFAULT '' NOT NULL,
	"last_name" text DEFAULT '' NOT NULL,
	"display_name" text NOT NULL,
	"email" text,
	"role" text NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "application_private_note_contributors_private_note_id_display_name_role_pk" PRIMARY KEY("private_note_id","display_name","role")
);
--> statement-breakpoint
CREATE TABLE "application_private_notes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"application_id" bigint NOT NULL,
	"content" text NOT NULL,
	"created_by_user_id" bigint,
	"created_by_first_name" text DEFAULT '' NOT NULL,
	"created_by_last_name" text DEFAULT '' NOT NULL,
	"created_by_email" text DEFAULT '' NOT NULL,
	"created_by_role" text DEFAULT 'system' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_legacy" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_shared_note_contributors" (
	"shared_note_id" text NOT NULL,
	"user_id" bigint,
	"first_name" text DEFAULT '' NOT NULL,
	"last_name" text DEFAULT '' NOT NULL,
	"display_name" text NOT NULL,
	"email" text,
	"role" text NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "application_shared_note_contributors_shared_note_id_display_name_role_pk" PRIMARY KEY("shared_note_id","display_name","role")
);
--> statement-breakpoint
CREATE TABLE "application_shared_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"application_id" bigint NOT NULL,
	"content" text NOT NULL,
	"created_by_user_id" bigint,
	"created_by_first_name" text DEFAULT '' NOT NULL,
	"created_by_last_name" text DEFAULT '' NOT NULL,
	"created_by_email" text DEFAULT '' NOT NULL,
	"created_by_role" text DEFAULT 'system' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_legacy" boolean DEFAULT false NOT NULL,
	"visibility" text DEFAULT 'coach_shared' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"job_id" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"status" text NOT NULL,
	"applied_at" timestamp with time zone NOT NULL,
	"follow_up_due_at" timestamp with time zone,
	"follow_up_enabled" boolean DEFAULT true NOT NULL,
	"last_follow_up_at" timestamp with time zone,
	"interview_at" timestamp with time zone,
	"interview_details" text,
	"beneficiary_notes" text,
	"proofs" text,
	"source_type" text DEFAULT 'tracked' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "application_events" ADD CONSTRAINT "application_events_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_events" ADD CONSTRAINT "application_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_jobs" ADD CONSTRAINT "application_jobs_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_private_note_contributors" ADD CONSTRAINT "application_private_note_contributors_private_note_id_application_private_notes_id_fk" FOREIGN KEY ("private_note_id") REFERENCES "public"."application_private_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_private_note_contributors" ADD CONSTRAINT "application_private_note_contributors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_private_notes" ADD CONSTRAINT "application_private_notes_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_private_notes" ADD CONSTRAINT "application_private_notes_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_shared_note_contributors" ADD CONSTRAINT "application_shared_note_contributors_shared_note_id_application_shared_notes_id_fk" FOREIGN KEY ("shared_note_id") REFERENCES "public"."application_shared_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_shared_note_contributors" ADD CONSTRAINT "application_shared_note_contributors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_shared_notes" ADD CONSTRAINT "application_shared_notes_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_shared_notes" ADD CONSTRAINT "application_shared_notes_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "application_events_application_created_idx" ON "application_events" USING btree ("application_id","created_at");--> statement-breakpoint
CREATE INDEX "application_events_event_type_created_idx" ON "application_events" USING btree ("event_type","created_at");--> statement-breakpoint
CREATE INDEX "application_jobs_provider_external_job_idx" ON "application_jobs" USING btree ("provider","external_job_id");--> statement-breakpoint
CREATE INDEX "application_jobs_company_idx" ON "application_jobs" USING btree ("company");--> statement-breakpoint
CREATE INDEX "application_jobs_title_idx" ON "application_jobs" USING btree ("title");--> statement-breakpoint
CREATE INDEX "application_private_note_contributors_user_id_idx" ON "application_private_note_contributors" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "application_private_notes_application_idx" ON "application_private_notes" USING btree ("application_id");--> statement-breakpoint
CREATE UNIQUE INDEX "application_private_notes_application_unique" ON "application_private_notes" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "application_shared_note_contributors_user_id_idx" ON "application_shared_note_contributors" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "application_shared_notes_application_updated_idx" ON "application_shared_notes" USING btree ("application_id","updated_at");--> statement-breakpoint
CREATE INDEX "applications_user_job_idx" ON "applications" USING btree ("user_id","job_id");--> statement-breakpoint
CREATE INDEX "applications_user_status_idx" ON "applications" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "applications_user_position_idx" ON "applications" USING btree ("user_id","position");--> statement-breakpoint
CREATE INDEX "applications_follow_up_due_idx" ON "applications" USING btree ("follow_up_due_at");--> statement-breakpoint
CREATE INDEX "applications_updated_at_idx" ON "applications" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "applications_user_job_unique" ON "applications" USING btree ("user_id","job_id");--> statement-breakpoint
INSERT INTO "applications" (
	"user_id",
	"job_id",
	"position",
	"status",
	"applied_at",
	"follow_up_due_at",
	"follow_up_enabled",
	"last_follow_up_at",
	"interview_at",
	"interview_details",
	"beneficiary_notes",
	"proofs",
	"source_type",
	"created_at",
	"updated_at"
)
SELECT
	ua."user_id",
	ua."job_id",
	ua."position",
	COALESCE(NULLIF(ua."application"->>'status', ''), 'in_progress'),
	COALESCE(NULLIF(ua."application"->>'appliedAt', '')::timestamp with time zone, ua."created_at"),
	NULLIF(ua."application"->>'followUpDueAt', '')::timestamp with time zone,
	COALESCE((ua."application"->>'followUpEnabled')::boolean, true),
	NULLIF(ua."application"->>'lastFollowUpAt', '')::timestamp with time zone,
	NULLIF(ua."application"->>'interviewAt', '')::timestamp with time zone,
	NULLIF(ua."application"->>'interviewDetails', ''),
	NULLIF(ua."application"->>'notes', ''),
	NULLIF(ua."application"->>'proofs', ''),
	CASE
		WHEN ua."job_id" LIKE 'manual-%' OR COALESCE(ua."application"->'job'->>'url', '#') = '#'
			THEN 'manual'
		ELSE 'tracked'
	END,
	ua."created_at",
	COALESCE(NULLIF(ua."application"->>'updatedAt', '')::timestamp with time zone, ua."created_at")
FROM "user_applications" ua
ON CONFLICT ("user_id", "job_id") DO NOTHING;--> statement-breakpoint
INSERT INTO "application_jobs" (
	"application_id",
	"provider",
	"external_job_id",
	"title",
	"company",
	"location",
	"contract_type",
	"url",
	"publication_date",
	"pdf_url",
	"description",
	"raw_payload"
)
SELECT
	a."id",
	NULLIF(ua."application"->'job'->>'source', ''),
	NULLIF(ua."application"->'job'->>'id', ''),
	COALESCE(NULLIF(ua."application"->'job'->>'title', ''), 'Sans intitulé'),
	NULLIF(ua."application"->'job'->>'company', ''),
	COALESCE(NULLIF(ua."application"->'job'->>'location', ''), 'Non précisé'),
	COALESCE(NULLIF(ua."application"->'job'->>'contractType', ''), 'Non précisé'),
	COALESCE(NULLIF(ua."application"->'job'->>'url', ''), '#'),
	NULLIF(ua."application"->'job'->>'publicationDate', '')::timestamp with time zone,
	NULLIF(ua."application"->'job'->>'pdfUrl', ''),
	NULLIF(ua."application"->'job'->>'description', ''),
	ua."application"->'job'
FROM "user_applications" ua
INNER JOIN "applications" a
	ON a."user_id" = ua."user_id"
	AND a."job_id" = ua."job_id"
ON CONFLICT ("application_id") DO NOTHING;--> statement-breakpoint
INSERT INTO "application_private_notes" (
	"application_id",
	"content",
	"created_by_user_id",
	"created_by_first_name",
	"created_by_last_name",
	"created_by_email",
	"created_by_role",
	"created_at",
	"updated_at",
	"is_legacy"
)
SELECT
	a."id",
	note_data."content",
	note_data."created_by_user_id",
	note_data."created_by_first_name",
	note_data."created_by_last_name",
	note_data."created_by_email",
	note_data."created_by_role",
	note_data."created_at",
	note_data."updated_at",
	note_data."is_legacy"
FROM "user_applications" ua
INNER JOIN "applications" a
	ON a."user_id" = ua."user_id"
	AND a."job_id" = ua."job_id"
INNER JOIN LATERAL (
	SELECT
		CASE
			WHEN COALESCE(NULLIF(BTRIM(ua."application"->'privateCoachNote'->>'content'), ''), '') <> ''
				THEN BTRIM(ua."application"->'privateCoachNote'->>'content')
			WHEN COALESCE(NULLIF(BTRIM(ua."application"->>'coachNote'), ''), '') <> ''
				AND COALESCE((ua."application"->>'shareCoachNoteWithBeneficiary')::boolean, false) = false
				THEN BTRIM(ua."application"->>'coachNote')
			ELSE NULL
		END AS "content",
		CASE
			WHEN COALESCE(NULLIF(BTRIM(ua."application"->'privateCoachNote'->>'content'), ''), '') <> ''
				AND NULLIF(ua."application"->'privateCoachNote'->'createdBy'->>'id', '') IS NOT NULL
				AND ua."application"->'privateCoachNote'->'createdBy'->>'role' <> 'system'
				THEN (ua."application"->'privateCoachNote'->'createdBy'->>'id')::bigint
			ELSE NULL
		END AS "created_by_user_id",
		CASE
			WHEN COALESCE(NULLIF(BTRIM(ua."application"->'privateCoachNote'->>'content'), ''), '') <> ''
				THEN COALESCE(ua."application"->'privateCoachNote'->'createdBy'->>'firstName', '')
			ELSE 'Historique'
		END AS "created_by_first_name",
		CASE
			WHEN COALESCE(NULLIF(BTRIM(ua."application"->'privateCoachNote'->>'content'), ''), '') <> ''
				THEN COALESCE(ua."application"->'privateCoachNote'->'createdBy'->>'lastName', '')
			ELSE ''
		END AS "created_by_last_name",
		CASE
			WHEN COALESCE(NULLIF(BTRIM(ua."application"->'privateCoachNote'->>'content'), ''), '') <> ''
				THEN COALESCE(ua."application"->'privateCoachNote'->'createdBy'->>'email', '')
			ELSE ''
		END AS "created_by_email",
		CASE
			WHEN COALESCE(NULLIF(BTRIM(ua."application"->'privateCoachNote'->>'content'), ''), '') <> ''
				THEN COALESCE(ua."application"->'privateCoachNote'->'createdBy'->>'role', 'system')
			ELSE 'system'
		END AS "created_by_role",
		COALESCE(
			NULLIF(ua."application"->'privateCoachNote'->>'createdAt', '')::timestamp with time zone,
			NULLIF(ua."application"->>'updatedAt', '')::timestamp with time zone,
			ua."created_at"
		) AS "created_at",
		COALESCE(
			NULLIF(ua."application"->'privateCoachNote'->>'updatedAt', '')::timestamp with time zone,
			NULLIF(ua."application"->>'updatedAt', '')::timestamp with time zone,
			ua."created_at"
		) AS "updated_at",
		CASE
			WHEN COALESCE(NULLIF(BTRIM(ua."application"->'privateCoachNote'->>'content'), ''), '') <> '' THEN false
			ELSE true
		END AS "is_legacy"
) note_data ON note_data."content" IS NOT NULL
ON CONFLICT ("application_id") DO NOTHING;--> statement-breakpoint
INSERT INTO "application_private_note_contributors" (
	"private_note_id",
	"user_id",
	"first_name",
	"last_name",
	"display_name",
	"email",
	"role"
)
SELECT
	apn."id",
	CASE
		WHEN contributor.value->>'role' <> 'system' AND NULLIF(contributor.value->>'id', '') IS NOT NULL
			THEN (contributor.value->>'id')::bigint
		ELSE NULL
	END,
	COALESCE(contributor.value->>'firstName', ''),
	COALESCE(contributor.value->>'lastName', ''),
	COALESCE(
		NULLIF(BTRIM(CONCAT_WS(' ', contributor.value->>'firstName', contributor.value->>'lastName')), ''),
		NULLIF(contributor.value->>'email', ''),
		'Historique'
	),
	NULLIF(contributor.value->>'email', ''),
	COALESCE(contributor.value->>'role', 'system')
FROM "user_applications" ua
INNER JOIN "applications" a
	ON a."user_id" = ua."user_id"
	AND a."job_id" = ua."job_id"
INNER JOIN "application_private_notes" apn
	ON apn."application_id" = a."id"
INNER JOIN LATERAL jsonb_array_elements(COALESCE(ua."application"->'privateCoachNote'->'contributors', '[]'::jsonb)) contributor(value)
	ON true
ON CONFLICT ("private_note_id", "display_name", "role") DO NOTHING;--> statement-breakpoint
INSERT INTO "application_private_note_contributors" (
	"private_note_id",
	"user_id",
	"first_name",
	"last_name",
	"display_name",
	"email",
	"role"
)
SELECT
	apn."id",
	NULL,
	'Historique',
	'',
	'Historique',
	NULL,
	'system'
FROM "application_private_notes" apn
WHERE apn."is_legacy" = true
ON CONFLICT ("private_note_id", "display_name", "role") DO NOTHING;--> statement-breakpoint
INSERT INTO "application_shared_notes" (
	"id",
	"application_id",
	"content",
	"created_by_user_id",
	"created_by_first_name",
	"created_by_last_name",
	"created_by_email",
	"created_by_role",
	"created_at",
	"updated_at",
	"is_legacy"
)
SELECT
	shared_data."note_id",
	a."id",
	shared_data."content",
	shared_data."created_by_user_id",
	shared_data."created_by_first_name",
	shared_data."created_by_last_name",
	shared_data."created_by_email",
	shared_data."created_by_role",
	shared_data."created_at",
	shared_data."updated_at",
	shared_data."is_legacy"
FROM "user_applications" ua
INNER JOIN "applications" a
	ON a."user_id" = ua."user_id"
	AND a."job_id" = ua."job_id"
INNER JOIN LATERAL (
	SELECT
		COALESCE(NULLIF(BTRIM(shared_note.value->>'content'), ''), '') AS "content",
		COALESCE(NULLIF(shared_note.value->>'id', ''), CONCAT('shared-', a."id", '-', shared_note.ordinality::text)) AS "note_id",
		CASE
			WHEN shared_note.value->'createdBy'->>'role' <> 'system'
				AND NULLIF(shared_note.value->'createdBy'->>'id', '') IS NOT NULL
				THEN (shared_note.value->'createdBy'->>'id')::bigint
			ELSE NULL
		END AS "created_by_user_id",
		COALESCE(shared_note.value->'createdBy'->>'firstName', '') AS "created_by_first_name",
		COALESCE(shared_note.value->'createdBy'->>'lastName', '') AS "created_by_last_name",
		COALESCE(shared_note.value->'createdBy'->>'email', '') AS "created_by_email",
		COALESCE(shared_note.value->'createdBy'->>'role', 'system') AS "created_by_role",
		COALESCE(
			NULLIF(shared_note.value->>'createdAt', '')::timestamp with time zone,
			NULLIF(shared_note.value->>'updatedAt', '')::timestamp with time zone,
			NULLIF(ua."application"->>'updatedAt', '')::timestamp with time zone,
			ua."created_at"
		) AS "created_at",
		COALESCE(
			NULLIF(shared_note.value->>'updatedAt', '')::timestamp with time zone,
			NULLIF(ua."application"->>'updatedAt', '')::timestamp with time zone,
			ua."created_at"
		) AS "updated_at",
		false AS "is_legacy"
	FROM jsonb_array_elements(COALESCE(ua."application"->'sharedCoachNotes', '[]'::jsonb)) WITH ORDINALITY shared_note(value, ordinality)
	UNION ALL
	SELECT
		BTRIM(ua."application"->>'coachNote') AS "content",
		CONCAT('legacy-shared-note-', a."id") AS "note_id",
		NULL AS "created_by_user_id",
		'Historique' AS "created_by_first_name",
		'' AS "created_by_last_name",
		'' AS "created_by_email",
		'system' AS "created_by_role",
		COALESCE(NULLIF(ua."application"->>'updatedAt', '')::timestamp with time zone, ua."created_at") AS "created_at",
		COALESCE(NULLIF(ua."application"->>'updatedAt', '')::timestamp with time zone, ua."created_at") AS "updated_at",
		true AS "is_legacy"
	WHERE COALESCE(NULLIF(BTRIM(ua."application"->>'coachNote'), ''), '') <> ''
		AND COALESCE((ua."application"->>'shareCoachNoteWithBeneficiary')::boolean, false) = true
) shared_data ON shared_data."content" <> ''
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
INSERT INTO "application_shared_note_contributors" (
	"shared_note_id",
	"user_id",
	"first_name",
	"last_name",
	"display_name",
	"email",
	"role"
)
SELECT
	COALESCE(NULLIF(shared_note.value->>'id', ''), CONCAT('shared-', a."id", '-', shared_note.ordinality::text)),
	CASE
		WHEN contributor.value->>'role' <> 'system' AND NULLIF(contributor.value->>'id', '') IS NOT NULL
			THEN (contributor.value->>'id')::bigint
		ELSE NULL
	END,
	COALESCE(contributor.value->>'firstName', ''),
	COALESCE(contributor.value->>'lastName', ''),
	COALESCE(
		NULLIF(BTRIM(CONCAT_WS(' ', contributor.value->>'firstName', contributor.value->>'lastName')), ''),
		NULLIF(contributor.value->>'email', ''),
		'Historique'
	),
	NULLIF(contributor.value->>'email', ''),
	COALESCE(contributor.value->>'role', 'system')
FROM "user_applications" ua
INNER JOIN "applications" a
	ON a."user_id" = ua."user_id"
	AND a."job_id" = ua."job_id"
INNER JOIN LATERAL jsonb_array_elements(COALESCE(ua."application"->'sharedCoachNotes', '[]'::jsonb)) WITH ORDINALITY shared_note(value, ordinality)
	ON true
INNER JOIN LATERAL jsonb_array_elements(COALESCE(shared_note.value->'contributors', '[]'::jsonb)) contributor(value)
	ON true
ON CONFLICT ("shared_note_id", "display_name", "role") DO NOTHING;--> statement-breakpoint
INSERT INTO "application_shared_note_contributors" (
	"shared_note_id",
	"user_id",
	"first_name",
	"last_name",
	"display_name",
	"email",
	"role"
)
SELECT
	asn."id",
	NULL,
	'Historique',
	'',
	'Historique',
	NULL,
	'system'
FROM "application_shared_notes" asn
WHERE asn."id" LIKE 'legacy-shared-note-%'
ON CONFLICT ("shared_note_id", "display_name", "role") DO NOTHING;
