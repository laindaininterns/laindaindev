-- ============================================================
-- Migration 08: Sync Seller Dashboard & Profitability Columns
-- ============================================================

-- 1. Add Seller Profile dashboard columns
ALTER TABLE seller_profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE seller_profiles ADD COLUMN IF NOT EXISTS main_category TEXT;
ALTER TABLE seller_profiles ADD COLUMN IF NOT EXISTS ntn_number TEXT;
ALTER TABLE seller_profiles ADD COLUMN IF NOT EXISTS proof_file_url TEXT;
ALTER TABLE seller_profiles ADD COLUMN IF NOT EXISTS uploaded_docs JSONB DEFAULT '[]'::jsonb;

-- 2. Add Product specifications columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS moq INT NOT NULL DEFAULT 1 CHECK (moq > 0);
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_out_of_stock BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index on SKU
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- 3. Add Orders Profitability & Datasheet columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cogs NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (cogs >= 0);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fees NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (fees >= 0);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (shipping >= 0);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS returns NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (returns >= 0);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS items_summary TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_name TEXT;

-- 4. Add Order Items Profitability columns
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS cogs NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (cogs >= 0);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fees NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (fees >= 0);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS shipping NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (shipping >= 0);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS returns NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (returns >= 0);

-- Grant schema permissions
GRANT ALL ON TABLE public.seller_profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.products TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.orders TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.order_items TO anon, authenticated, service_role;
