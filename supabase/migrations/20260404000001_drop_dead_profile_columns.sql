-- Phase 1B: Drop dead profile columns
--
-- These columns were never updated after initial insert (always 0/null):
-- - Counter fields: follower_count, following_count, profile_views, login_count,
--   campaign_count, total_raised, total_donated (all hardcoded to 0, never incremented)
-- - Duplicate balance fields: bitcoin_balance, lightning_balance (real data in wallets table)
-- - Unused feature fields: theme_preferences, custom_css, profile_color, profile_badges,
--   cover_image_url, two_factor_enabled
-- - Deprecated identity: display_name (replaced by name, now synced to actors via trigger)
--
-- Reduces profiles from 63 to ~40 columns.
-- All code references removed in Phase 1A (prior commit).

ALTER TABLE profiles
  DROP COLUMN IF EXISTS follower_count,
  DROP COLUMN IF EXISTS following_count,
  DROP COLUMN IF EXISTS profile_views,
  DROP COLUMN IF EXISTS login_count,
  DROP COLUMN IF EXISTS campaign_count,
  DROP COLUMN IF EXISTS total_raised,
  DROP COLUMN IF EXISTS total_donated,
  DROP COLUMN IF EXISTS bitcoin_balance,
  DROP COLUMN IF EXISTS lightning_balance,
  DROP COLUMN IF EXISTS theme_preferences,
  DROP COLUMN IF EXISTS custom_css,
  DROP COLUMN IF EXISTS profile_color,
  DROP COLUMN IF EXISTS profile_badges,
  DROP COLUMN IF EXISTS cover_image_url,
  DROP COLUMN IF EXISTS two_factor_enabled,
  DROP COLUMN IF EXISTS display_name;
