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
CREATE INDEX "featured_searches_active_sort_idx" ON "featured_searches" USING btree ("is_active","sort_order");--> statement-breakpoint
CREATE INDEX "featured_searches_updated_at_idx" ON "featured_searches" USING btree ("updated_at");