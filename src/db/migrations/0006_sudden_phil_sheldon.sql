ALTER TABLE "quotes" DROP CONSTRAINT "quotes_work_order_id_work_orders_id_fk";
--> statement-breakpoint
ALTER TABLE "quotes" ALTER COLUMN "work_order_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE set null ON UPDATE no action;