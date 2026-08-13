-- ============================================================
-- Migration 09: Admin Dashboard Alignment & Audit Tracking
-- ============================================================

-- 1. Seller Profile Verification Audit Columns
ALTER TABLE seller_profiles 
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 2. Buyer Profile Business Store Name Columns
ALTER TABLE buyer_profiles 
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS store_name TEXT;

-- 3. Order Administrative Notes & Courier Shipping Tracking
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS courier_name TEXT;

-- 4. Order Item Admin Override Status
ALTER TABLE order_items 
  ADD COLUMN IF NOT EXISTS admin_override_status TEXT;

-- Grant permissions for schema additions
GRANT ALL ON TABLE public.seller_profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.buyer_profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.orders TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.order_items TO anon, authenticated, service_role;
