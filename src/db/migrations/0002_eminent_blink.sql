CREATE TABLE "signatures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"signed_by" text NOT NULL,
	"signature_svg" text NOT NULL,
	"signature_png_url" text,
	"ip_address" text,
	"user_agent" text,
	"location" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "work_order_signatures" CASCADE;--> statement-breakpoint
ALTER TABLE "signatures" ADD CONSTRAINT "signatures_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_signatures_company_entity" ON "signatures" USING btree ("company_id","entity_type","entity_id");