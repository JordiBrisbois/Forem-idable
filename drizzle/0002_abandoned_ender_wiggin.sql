ALTER TABLE "coach_groups" ADD COLUMN "manager_coach_user_id" bigint;--> statement-breakpoint
UPDATE "coach_groups"
SET "manager_coach_user_id" = "created_by"
WHERE EXISTS (
	SELECT 1
	FROM "coach_group_coaches"
	INNER JOIN "users" ON "users"."id" = "coach_group_coaches"."user_id"
	WHERE "coach_group_coaches"."group_id" = "coach_groups"."id"
	  AND "coach_group_coaches"."user_id" = "coach_groups"."created_by"
	  AND "users"."role" = 'coach'
);--> statement-breakpoint
ALTER TABLE "coach_groups" ADD CONSTRAINT "coach_groups_manager_coach_user_id_users_id_fk" FOREIGN KEY ("manager_coach_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coach_groups_manager_coach_user_id_idx" ON "coach_groups" USING btree ("manager_coach_user_id");
