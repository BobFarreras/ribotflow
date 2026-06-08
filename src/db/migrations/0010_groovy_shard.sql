CREATE TABLE "smtp_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"host" text NOT NULL,
	"port" integer DEFAULT 587 NOT NULL,
	"user" text NOT NULL,
	"password_encrypted" text NOT NULL,
	"secure" boolean DEFAULT false NOT NULL,
	"accept_self_signed" boolean DEFAULT false NOT NULL,
	"from_name" text,
	"from_email" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "address_street" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "address_city" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "address_postal_code" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "address_country" text DEFAULT 'ES';--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "legal_text" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "default_tax_rate" numeric(5, 2) DEFAULT '21';--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "default_currency" text DEFAULT 'EUR';--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "default_locale" text DEFAULT 'ca';--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "timezone" text DEFAULT 'Europe/Madrid';--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "quote_prefix" text DEFAULT 'PRE';--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "invoice_prefix" text DEFAULT 'INV';--> statement-breakpoint
ALTER TABLE "smtp_configs" ADD CONSTRAINT "smtp_configs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_smtp_configs_company_id" ON "smtp_configs" USING btree ("company_id");
