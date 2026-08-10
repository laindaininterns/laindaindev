-- 1. Add all missing columns to buyer_profiles table
ALTER TABLE buyer_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE buyer_profiles ADD COLUMN IF NOT EXISTS contact_number TEXT;
ALTER TABLE buyer_profiles ADD COLUMN IF NOT EXISTS billing_address TEXT;
ALTER TABLE buyer_profiles ADD COLUMN IF NOT EXISTS shipping_address TEXT;

-- 2. Add all missing columns to seller_profiles table
ALTER TABLE seller_profiles ADD COLUMN IF NOT EXISTS contact_number TEXT;
ALTER TABLE seller_profiles ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE seller_profiles ADD COLUMN IF NOT EXISTS business_address TEXT;
ALTER TABLE seller_profiles ADD COLUMN IF NOT EXISTS tax_id TEXT;
