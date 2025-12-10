-- ROLLBACK: 20251204_user_settings_privacy
-- Generated: 2025-12-04T12:37:00.497Z
-- Source: 20251204_user_settings_privacy.sql

DROP TABLE IF EXISTS user_settings CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS IF;
DROP FUNCTION IF EXISTS get_or_create_user_settings;
-- MANUAL: Review data inserted into user_settings
DROP FUNCTION IF EXISTS update_user_settings_timestamp;
DROP TRIGGER IF EXISTS trigger_user_settings_updated_at ON user_settings;
DROP TABLE IF EXISTS currency_rates CASCADE;
-- MANUAL: Review data inserted into currency_rates

-- Rollback completed: 20251204_user_settings_privacy