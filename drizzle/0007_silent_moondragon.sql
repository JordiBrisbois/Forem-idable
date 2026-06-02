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
ALTER TABLE "account_deletion_requests" ADD CONSTRAINT "account_deletion_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_deletion_requests" ADD CONSTRAINT "account_deletion_requests_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_export_requests" ADD CONSTRAINT "data_export_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disclosure_logs" ADD CONSTRAINT "disclosure_logs_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_holds" ADD CONSTRAINT "legal_holds_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_deletion_requests_user_requested_idx" ON "account_deletion_requests" USING btree ("user_id","requested_at");--> statement-breakpoint
CREATE INDEX "account_deletion_requests_user_status_idx" ON "account_deletion_requests" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "data_export_requests_user_created_idx" ON "data_export_requests" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "data_export_requests_user_status_idx" ON "data_export_requests" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "data_export_requests_expires_at_idx" ON "data_export_requests" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "disclosure_logs_request_type_created_idx" ON "disclosure_logs" USING btree ("request_type","created_at");--> statement-breakpoint
CREATE INDEX "disclosure_logs_target_idx" ON "disclosure_logs" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "disclosure_logs_created_by_idx" ON "disclosure_logs" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "legal_holds_target_idx" ON "legal_holds" USING btree ("target_type","target_id","released_at");--> statement-breakpoint
CREATE INDEX "legal_holds_created_by_idx" ON "legal_holds" USING btree ("created_by_user_id");