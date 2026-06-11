CREATE TABLE "client_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"name" text NOT NULL,
	"position" text,
	"phone" text,
	"email" text,
	"is_primary" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "contact_person" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "position" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "fiscal_data" jsonb;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "category_id" uuid;--> statement-breakpoint
ALTER TABLE "client_categories" ADD CONSTRAINT "client_categories_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_client_categories_company_id" ON "client_categories" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_client_contacts_client_id" ON "client_contacts" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_clients_category_id" ON "clients" USING btree ("category_id");