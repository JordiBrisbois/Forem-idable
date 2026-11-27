ALTER TABLE "forem_offers" ADD COLUMN "regime" text;--> statement-breakpoint
ALTER TABLE "forem_offers" ADD COLUMN "sectors" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "forem_offers" ADD COLUMN "languages" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "forem_offers" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "forem_offers" ADD COLUMN "longitude" double precision;--> statement-breakpoint
ALTER TABLE "forem_offers" ADD COLUMN "first_seen_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "forem_offers_regime_idx" ON "forem_offers" USING btree ("regime");--> statement-breakpoint
CREATE INDEX "forem_offers_first_seen_idx" ON "forem_offers" USING btree ("first_seen_at");--> statement-breakpoint
CREATE INDEX "forem_offers_search_gin_idx" ON "forem_offers" USING gin (to_tsvector('french', "search_text"));