-- Add location_context to profiles (used for privacy/group labels and region context)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS location_context text;

