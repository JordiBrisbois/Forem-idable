CREATE TABLE "forem_offers" (
	"offer_id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"company" text,
	"contract_type" text DEFAULT 'AUTRE' NOT NULL,
	"contract_type_raw" text,
	"region" text,
	"localities" text[] DEFAULT '{}'::text[] NOT NULL,
	"postal_codes" text[] DEFAULT '{}'::text[] NOT NULL,
	"metier" text,
	"publication_date" timestamp with time zone,
	"url" text NOT NULL,
	"search_text" text DEFAULT '' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source_synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forem_offers_sync_state" (
	"id" text PRIMARY KEY NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text DEFAULT 'running' NOT NULL,
	"records_synced" integer DEFAULT 0 NOT NULL,
	"error_message" text
);
--> statement-breakpoint
CREATE INDEX "forem_offers_contract_type_idx" ON "forem_offers" USING btree ("contract_type");--> statement-breakpoint
CREATE INDEX "forem_offers_publication_idx" ON "forem_offers" USING btree ("publication_date");--> statement-breakpoint
CREATE INDEX "forem_offers_region_idx" ON "forem_offers" USING btree ("region");