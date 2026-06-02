CREATE TABLE IF NOT EXISTS "scout_jobs" (
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
CREATE TABLE IF NOT EXISTS "scout_results" (
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
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_actor_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "actor_user_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "scout_jobs" ADD CONSTRAINT "scout_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "scout_results" ADD CONSTRAINT "scout_results_job_id_scout_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."scout_jobs"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scout_jobs_user_status_idx" ON "scout_jobs" USING btree ("user_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scout_jobs_created_at_idx" ON "scout_jobs" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scout_results_job_id_idx" ON "scout_results" USING btree ("job_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scout_results_email_idx" ON "scout_results" USING btree ("email");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scout_results_osm_id_idx" ON "scout_results" USING btree ("osm_id");
