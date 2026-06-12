ALTER TABLE "quotes" ADD COLUMN "share_token" text;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "share_token_expires_at" timestamp;--> statement-breakpoint
CREATE INDEX "idx_quotes_share_token" ON "quotes" USING btree ("share_token");