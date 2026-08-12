-- ============================================================
-- Migration 06: Guest Checkout & Account Merge System
-- ============================================================

-- 1. Modify cart_items table for guest support
ALTER TABLE cart_items ALTER COLUMN buyer_profile_id DROP NOT NULL;
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS guest_id TEXT;

-- Drop old unique constraint if present
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS unique_buyer_product;

-- Add check constraint ensuring either buyer_profile_id OR guest_id is set
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_owner_check;
ALTER TABLE cart_items ADD CONSTRAINT cart_items_owner_check 
    CHECK (buyer_profile_id IS NOT NULL OR guest_id IS NOT NULL);

-- Create partial unique indexes for cart items
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_buyer_product 
    ON cart_items (buyer_profile_id, product_id) 
    WHERE buyer_profile_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_guest_product 
    ON cart_items (guest_id, product_id) 
    WHERE guest_id IS NOT NULL;

-- 2. Modify orders table for guest support
ALTER TABLE orders ALTER COLUMN buyer_profile_id DROP NOT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_phone TEXT;

-- Add check constraint ensuring order has an identifiable buyer context
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_buyer_check;
ALTER TABLE orders ADD CONSTRAINT orders_buyer_check 
    CHECK (buyer_profile_id IS NOT NULL OR guest_id IS NOT NULL OR guest_email IS NOT NULL);

-- Create performance indexes for guest lookup & account merge queries
CREATE INDEX IF NOT EXISTS idx_orders_guest_id ON orders(guest_id) WHERE guest_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_guest_email ON orders(guest_email) WHERE guest_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_guest_phone ON orders(guest_phone) WHERE guest_phone IS NOT NULL;

-- Grant schema permissions
GRANT ALL ON TABLE public.cart_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.orders TO anon, authenticated, service_role;
