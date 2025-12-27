CREATE TYPE "public"."inventory_movement_actor_type" AS ENUM('ADMIN', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."inventory_movement_reason" AS ENUM('INITIAL_STOCK', 'PURCHASE', 'ADJUSTMENT', 'ORDER_CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."inventory_movement_reference_type" AS ENUM('ORDER', 'PURCHASE', 'ADJUSTMENT');--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"delta_quantity" integer NOT NULL,
	"reason" "inventory_movement_reason" NOT NULL,
	"reference_type" "inventory_movement_reference_type",
	"reference_id" uuid,
	"actor_type" "inventory_movement_actor_type" NOT NULL,
	"actor_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;