CREATE TABLE "forem_offer_details" (
	"offer_id" text PRIMARY KEY NOT NULL,
	"detail" jsonb NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "forem_offer_details" ADD CONSTRAINT "forem_offer_details_offer_id_forem_offers_offer_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."forem_offers"("offer_id") ON DELETE cascade ON UPDATE no action;