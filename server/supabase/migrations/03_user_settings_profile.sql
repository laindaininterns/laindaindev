-- Add missing profile columns for settings management
ALTER TABLE buyer_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE seller_profiles ADD COLUMN IF NOT EXISTS contact_number TEXT;
