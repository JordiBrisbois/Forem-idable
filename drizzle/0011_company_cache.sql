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
CREATE INDEX "company_cache_website_idx" ON "company_cache" USING btree ("website");--> statement-breakpoint
CREATE INDEX "company_cache_scraped_at_idx" ON "company_cache" USING btree ("scraped_at");

-- Convert old pending/running jobs to queued so the new worker picks them up
UPDATE scout_jobs SET status = 'queued' WHERE status IN ('pending', 'running');