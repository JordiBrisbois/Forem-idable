CREATE TABLE "account_deletion_requests" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reason" text,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by_user_id" bigint,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"review_note" text
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"name" text NOT NULL,
	"token_hash" text NOT NULL,
	"key_prefix" text NOT NULL,
	"last_four" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "api_keys_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
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
CREATE TABLE "audit_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"actor_user_id" bigint,
	"action" text NOT NULL,
	"target_user_id" bigint,
	"group_id" bigint,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_subscriptions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"scope" text DEFAULT 'group' NOT NULL,
	"group_id" bigint,
	"token_hash" text NOT NULL,
	"key_prefix" text DEFAULT '' NOT NULL,
	"last_four" text DEFAULT '' NOT NULL,
	"created_by" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "calendar_subscriptions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "coach_group_coaches" (
	"group_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coach_group_coaches_group_id_user_id_pk" PRIMARY KEY("group_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "coach_group_members" (
	"group_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coach_group_members_group_id_user_id_pk" PRIMARY KEY("group_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "coach_groups" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_by" bigint NOT NULL,
	"manager_coach_user_id" bigint,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_cache" (
	"osm_id" bigint PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT '?' NOT NULL,
	"email" text,
	"website" text,
	"phone" text,
	"address" text,
	"lat" text,
	"lon" text,
	"town" text,
	"email_source" text DEFAULT '' NOT NULL,
	"all_emails" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"scraped_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_messages" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"conversation_id" bigint NOT NULL,
	"author_user_id" bigint,
	"type" text DEFAULT 'text' NOT NULL,
	"content" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"edited_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "conversation_participants" (
	"conversation_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"role_snapshot" text DEFAULT 'user' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone,
	CONSTRAINT "conversation_participants_conversation_id_user_id_pk" PRIMARY KEY("conversation_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "conversation_reads" (
	"conversation_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"last_read_message_id" bigint,
	"last_read_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversation_reads_conversation_id_user_id_pk" PRIMARY KEY("conversation_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"type" text DEFAULT 'group' NOT NULL,
	"group_id" bigint,
	"direct_user_a_id" bigint,
	"direct_user_b_id" bigint,
	"created_by_user_id" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_export_requests" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"format" text DEFAULT 'json' NOT NULL,
	"payload" jsonb,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "disclosure_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"request_type" text DEFAULT 'authority_request' NOT NULL,
	"authority_name" text NOT NULL,
	"legal_basis" text,
	"target_type" text NOT NULL,
	"target_id" bigint,
	"scope_summary" text NOT NULL,
	"export_reference" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by_user_id" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "featured_searches" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"cta_label" text NOT NULL,
	"query" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legal_holds" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"target_type" text NOT NULL,
	"target_id" bigint NOT NULL,
	"reason" text NOT NULL,
	"created_by_user_id" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"released_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scout_jobs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"query" text NOT NULL,
	"lat" text NOT NULL,
	"lon" text NOT NULL,
	"radius" integer NOT NULL,
	"categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"scrape_emails" boolean DEFAULT false NOT NULL,
	"total_steps" integer DEFAULT 0 NOT NULL,
	"completed_steps" integer DEFAULT 0 NOT NULL,
	"result_count" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "scout_results" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"job_id" bigint NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT '?' NOT NULL,
	"email" text,
	"website" text,
	"phone" text,
	"address" text,
	"lat" text,
	"lon" text,
	"town" text,
	"email_source" text DEFAULT '' NOT NULL,
	"all_emails" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"osm_id" bigint
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_favorites" (
	"user_id" bigint NOT NULL,
	"job_id" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"job" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_favorites_user_id_job_id_pk" PRIMARY KEY("user_id","job_id")
);
--> statement-breakpoint
CREATE TABLE "user_search_history" (
	"user_id" bigint NOT NULL,
	"entry_id" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"entry" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_search_history_user_id_entry_id_pk" PRIMARY KEY("user_id","entry_id")
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" bigint PRIMARY KEY NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"theme" text,
	"analytics_consent" text,
	"locations_cache" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" text DEFAULT '' NOT NULL,
	"last_name" text DEFAULT '' NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"last_seen_at" timestamp with time zone,
	"last_coach_action_at" timestamp with time zone,
	"search_goal" text DEFAULT 'job' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "account_deletion_requests" ADD CONSTRAINT "account_deletion_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_deletion_requests" ADD CONSTRAINT "account_deletion_requests_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_group_id_coach_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."coach_groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_subscriptions" ADD CONSTRAINT "calendar_subscriptions_group_id_coach_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."coach_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_subscriptions" ADD CONSTRAINT "calendar_subscriptions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_group_coaches" ADD CONSTRAINT "coach_group_coaches_group_id_coach_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."coach_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_group_coaches" ADD CONSTRAINT "coach_group_coaches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_group_members" ADD CONSTRAINT "coach_group_members_group_id_coach_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."coach_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_group_members" ADD CONSTRAINT "coach_group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_groups" ADD CONSTRAINT "coach_groups_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_groups" ADD CONSTRAINT "coach_groups_manager_coach_user_id_users_id_fk" FOREIGN KEY ("manager_coach_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_reads" ADD CONSTRAINT "conversation_reads_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_reads" ADD CONSTRAINT "conversation_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_reads" ADD CONSTRAINT "conversation_reads_last_read_message_id_conversation_messages_id_fk" FOREIGN KEY ("last_read_message_id") REFERENCES "public"."conversation_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_group_id_coach_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."coach_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_direct_user_a_id_users_id_fk" FOREIGN KEY ("direct_user_a_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_direct_user_b_id_users_id_fk" FOREIGN KEY ("direct_user_b_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_export_requests" ADD CONSTRAINT "data_export_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disclosure_logs" ADD CONSTRAINT "disclosure_logs_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_holds" ADD CONSTRAINT "legal_holds_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scout_jobs" ADD CONSTRAINT "scout_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scout_results" ADD CONSTRAINT "scout_results_job_id_scout_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."scout_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_search_history" ADD CONSTRAINT "user_search_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_deletion_requests_user_requested_idx" ON "account_deletion_requests" USING btree ("user_id","requested_at");--> statement-breakpoint
CREATE INDEX "account_deletion_requests_user_status_idx" ON "account_deletion_requests" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "api_keys_user_id_idx" ON "api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "api_keys_active_idx" ON "api_keys" USING btree ("user_id","revoked_at");--> statement-breakpoint
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
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_target_user_id_idx" ON "audit_logs" USING btree ("target_user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_group_id_idx" ON "audit_logs" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action","created_at");--> statement-breakpoint
CREATE INDEX "calendar_subscriptions_scope_group_idx" ON "calendar_subscriptions" USING btree ("scope","group_id","revoked_at");--> statement-breakpoint
CREATE INDEX "calendar_subscriptions_created_by_idx" ON "calendar_subscriptions" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "coach_group_coaches_user_id_idx" ON "coach_group_coaches" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "coach_group_members_user_id_idx" ON "coach_group_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "coach_groups_created_by_idx" ON "coach_groups" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "coach_groups_manager_coach_user_id_idx" ON "coach_groups" USING btree ("manager_coach_user_id");--> statement-breakpoint
CREATE INDEX "coach_groups_archived_at_idx" ON "coach_groups" USING btree ("archived_at");--> statement-breakpoint
CREATE INDEX "company_cache_website_idx" ON "company_cache" USING btree ("website");--> statement-breakpoint
CREATE INDEX "company_cache_scraped_at_idx" ON "company_cache" USING btree ("scraped_at");--> statement-breakpoint
CREATE INDEX "conversation_messages_conversation_created_idx" ON "conversation_messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "conversation_messages_author_idx" ON "conversation_messages" USING btree ("author_user_id");--> statement-breakpoint
CREATE INDEX "conversation_participants_user_idx" ON "conversation_participants" USING btree ("user_id","left_at");--> statement-breakpoint
CREATE INDEX "conversation_reads_user_idx" ON "conversation_reads" USING btree ("user_id","last_read_at");--> statement-breakpoint
CREATE INDEX "conversations_type_last_message_idx" ON "conversations" USING btree ("type","last_message_at");--> statement-breakpoint
CREATE UNIQUE INDEX "conversations_group_unique" ON "conversations" USING btree ("group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "conversations_direct_pair_unique" ON "conversations" USING btree ("type","direct_user_a_id","direct_user_b_id");--> statement-breakpoint
CREATE INDEX "data_export_requests_user_created_idx" ON "data_export_requests" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "data_export_requests_user_status_idx" ON "data_export_requests" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "data_export_requests_expires_at_idx" ON "data_export_requests" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "disclosure_logs_request_type_created_idx" ON "disclosure_logs" USING btree ("request_type","created_at");--> statement-breakpoint
CREATE INDEX "disclosure_logs_target_idx" ON "disclosure_logs" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "disclosure_logs_created_by_idx" ON "disclosure_logs" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "featured_searches_active_sort_idx" ON "featured_searches" USING btree ("is_active","sort_order");--> statement-breakpoint
CREATE INDEX "featured_searches_updated_at_idx" ON "featured_searches" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "legal_holds_target_idx" ON "legal_holds" USING btree ("target_type","target_id","released_at");--> statement-breakpoint
CREATE INDEX "legal_holds_created_by_idx" ON "legal_holds" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_expires_at_idx" ON "password_reset_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "scout_jobs_user_status_idx" ON "scout_jobs" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "scout_jobs_created_at_idx" ON "scout_jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "scout_results_job_id_idx" ON "scout_results" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "scout_results_email_idx" ON "scout_results" USING btree ("email");--> statement-breakpoint
CREATE INDEX "scout_results_osm_id_idx" ON "scout_results" USING btree ("osm_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "user_favorites_user_position_idx" ON "user_favorites" USING btree ("user_id","position");--> statement-breakpoint
CREATE INDEX "user_search_history_user_position_idx" ON "user_search_history" USING btree ("user_id","position");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "chk_users_role" CHECK ("role" IN ('user', 'coach', 'admin'));--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "chk_users_search_goal" CHECK ("search_goal" IN ('internship', 'job'));--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "chk_applications_status" CHECK ("status" IN ('in_progress', 'follow_up', 'interview', 'accepted', 'rejected'));--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "chk_conversations_type" CHECK ("type" IN ('direct', 'group'));--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD CONSTRAINT "chk_messages_type" CHECK ("type" IN ('text', 'job_share'));--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD CONSTRAINT "chk_message_content_length" CHECK (length("content") <= 4000);--> statement-breakpoint
ALTER TABLE "application_private_notes" ADD CONSTRAINT "chk_note_content_length" CHECK (length("content") <= 10000);--> statement-breakpoint
ALTER TABLE "application_shared_notes" ADD CONSTRAINT "chk_shared_note_content_length" CHECK (length("content") <= 10000);