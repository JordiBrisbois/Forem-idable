CREATE TABLE "coach_group_coaches" (
	"group_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coach_group_coaches_group_id_user_id_pk" PRIMARY KEY("group_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "coach_group_coaches" ADD CONSTRAINT "coach_group_coaches_group_id_coach_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."coach_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_group_coaches" ADD CONSTRAINT "coach_group_coaches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coach_group_coaches_user_id_idx" ON "coach_group_coaches" USING btree ("user_id");