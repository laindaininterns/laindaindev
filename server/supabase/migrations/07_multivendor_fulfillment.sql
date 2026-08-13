-- ============================================================
-- Migration 07: Multivendor Order Fulfillment & Logistics Control
-- ============================================================

-- 1. Create Seller Order Item Status ENUM
DO $$ BEGIN
    CREATE TYPE order_item_seller_status AS ENUM ('PENDING', 'ACCEPTED_BY_SELLER', 'READY_FOR_PICKUP', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add seller_status column to order_items if missing
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS seller_status TEXT NOT NULL DEFAULT 'PENDING';

-- 3. Add performance & relational indexes for multivendor fulfillment
CREATE INDEX IF NOT EXISTS idx_order_items_seller_id ON order_items(seller_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_profile_id ON orders(buyer_profile_id) WHERE buyer_profile_id IS NOT NULL;

-- 4. Grant schema permissions
GRANT ALL ON TABLE public.orders TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.order_items TO anon, authenticated, service_role;
