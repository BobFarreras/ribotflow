ALTER TABLE "companies" ADD COLUMN "company_address" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "company_location" jsonb;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "travel_rate_per_km" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "travel_distance_km" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "travel_duration_minutes" integer;