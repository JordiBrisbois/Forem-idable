CREATE TABLE "user_stage_history" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"stage" text NOT NULL,
	"reason" text,
	"created_by_user_id" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "beneficiary_stage" text DEFAULT 'internship_search' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_stage_history" ADD CONSTRAINT "user_stage_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stage_history" ADD CONSTRAINT "user_stage_history_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_stage_history_user_id_idx" ON "user_stage_history" USING btree ("user_id","created_at");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "chk_users_beneficiary_stage" CHECK ("beneficiary_stage" IN ('internship_search', 'internship_ongoing', 'job_search', 'employed', 'exited'));--> statement-breakpoint
ALTER TABLE "user_stage_history" ADD CONSTRAINT "chk_stage_history_stage" CHECK ("stage" IN ('internship_search', 'internship_ongoing', 'job_search', 'employed', 'exited'));