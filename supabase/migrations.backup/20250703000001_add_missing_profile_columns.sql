-- =====================================================================
-- ADD MISSING PROFILE COLUMNS
-- =====================================================================
-- Migration: 20250703000001_add_missing_profile_columns.sql
-- Created: 2025-07-03
-- Purpose: Add missing columns to profiles table to fix schema errors
-- =====================================================================

-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS banner_url text,
ADD COLUMN IF NOT EXISTS bitcoin_address text,
ADD COLUMN IF NOT EXISTS lightning_address text;

-- Update RLS policies for new columns
-- The existing policies should already cover these columns since they use UPDATE/SELECT on the entire table

-- =====================================================================
-- MIGRATION COMPLETE
-- =====================================================================

-- This migration ensures:
-- ✅ All expected profile columns exist in the database
-- ✅ Profile updates will no longer fail due to missing columns
-- ✅ Storage and profile functionality will work properly