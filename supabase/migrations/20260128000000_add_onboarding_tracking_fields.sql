-- Migration: Add onboarding tracking fields
-- Purpose: Track granular onboarding progress for FTUE improvements
-- Created: 2026-01-28

-- Add new onboarding tracking fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_wallet_setup_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_first_project_created BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_method TEXT DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN profiles.onboarding_wallet_setup_completed IS 'Whether user completed wallet setup during onboarding';
COMMENT ON COLUMN profiles.onboarding_first_project_created IS 'Whether user created their first project after onboarding';
COMMENT ON COLUMN profiles.onboarding_method IS 'How user completed onboarding: standard, intelligent, skipped';

-- Add check constraint for onboarding_method
ALTER TABLE public.profiles
ADD CONSTRAINT chk_onboarding_method
CHECK (onboarding_method IS NULL OR onboarding_method IN ('standard', 'intelligent', 'skipped'));
