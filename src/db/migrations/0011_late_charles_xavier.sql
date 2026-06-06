ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "invitation_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "invitation_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "invited_by" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "invited_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_active_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_users_invitation_token" ON "users" USING btree ("invitation_token");--> statement-breakpoint
CREATE INDEX "idx_users_company_status" ON "users" USING btree ("company_id","status");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_invitation_token_unique" UNIQUE("invitation_token");