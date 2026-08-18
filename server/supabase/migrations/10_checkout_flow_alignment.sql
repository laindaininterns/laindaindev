-- ============================================================
-- Migration 10: Checkout Flow Alignment (Signed-in & Guest)
-- ============================================================

-- 1. Orders table updates for checkout fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'COD';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- 2. Order items table updates for unit_price and subtotal
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12, 2);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12, 2);

-- Grant schema permissions
GRANT ALL ON TABLE public.orders TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.order_items TO anon, authenticated, service_role;
