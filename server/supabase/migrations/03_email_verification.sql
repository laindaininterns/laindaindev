-- Migration: 03_email_verification.sql
-- Add email verification fields to core users table

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS email_verification_token TEXT;
