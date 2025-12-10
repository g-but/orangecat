-- =====================================================
-- USER SETTINGS & PRIVACY CONTROLS
-- Adds user preferences including currency settings and 
-- privacy controls for profile fields
-- 
-- Created: 2025-12-04
-- Last Modified: 2025-12-04
-- Last Modified Summary: Initial user settings and privacy migration
-- =====================================================

-- 1. Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Currency preferences
  default_currency text NOT NULL DEFAULT 'CHF', -- CHF, EUR, USD, GBP, BTC, SATS
  display_currency text NOT NULL DEFAULT 'CHF', -- What users see amounts in
  country_code text, -- ISO 3166-1 alpha-2 for auto-detecting default currency
  
  -- Privacy settings (what's visible to public)
  show_email boolean NOT NULL DEFAULT false,
  show_phone boolean NOT NULL DEFAULT false,
  show_physical_address boolean NOT NULL DEFAULT false,
  show_location boolean NOT NULL DEFAULT true, -- City-level location
  show_exact_location boolean NOT NULL DEFAULT false, -- Precise coordinates
  
  -- Notification preferences
  email_notifications boolean NOT NULL DEFAULT true,
  push_notifications boolean NOT NULL DEFAULT true,
  marketing_emails boolean NOT NULL DEFAULT false,
  
  -- Display preferences
  theme text NOT NULL DEFAULT 'system', -- light, dark, system
  language text NOT NULL DEFAULT 'en',
  timezone text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  UNIQUE(user_id)
);

-- 2. Add physical address fields to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS street_address text,
  ADD COLUMN IF NOT EXISTS street_address_2 text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS state_province text;

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_country ON user_settings(country_code);

-- 4. Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for user_settings
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Function to get or create user settings
CREATE OR REPLACE FUNCTION get_or_create_user_settings(p_user_id uuid)
RETURNS user_settings
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_settings user_settings;
  v_country text;
BEGIN
  -- Try to get existing settings
  SELECT * INTO v_settings FROM user_settings WHERE user_id = p_user_id;
  
  -- If not found, create with defaults based on profile location
  IF NOT FOUND THEN
    -- Get country from profile for currency default
    SELECT location_country INTO v_country FROM profiles WHERE id = p_user_id;
    
    INSERT INTO user_settings (
      user_id, 
      default_currency, 
      display_currency,
      country_code
    )
    VALUES (
      p_user_id,
      CASE 
        WHEN v_country = 'CH' THEN 'CHF'
        WHEN v_country IN ('DE', 'FR', 'IT', 'ES', 'NL', 'AT', 'BE') THEN 'EUR'
        WHEN v_country = 'GB' THEN 'GBP'
        WHEN v_country = 'US' THEN 'USD'
        ELSE 'CHF'
      END,
      CASE 
        WHEN v_country = 'CH' THEN 'CHF'
        WHEN v_country IN ('DE', 'FR', 'IT', 'ES', 'NL', 'AT', 'BE') THEN 'EUR'
        WHEN v_country = 'GB' THEN 'GBP'
        WHEN v_country = 'US' THEN 'USD'
        ELSE 'CHF'
      END,
      v_country
    )
    RETURNING * INTO v_settings;
  END IF;
  
  RETURN v_settings;
END;
$$;

-- 7. Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_user_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_settings_updated_at ON user_settings;
CREATE TRIGGER trigger_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_timestamp();

-- 8. Currency rates table (for caching exchange rates)
CREATE TABLE IF NOT EXISTS currency_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency text NOT NULL DEFAULT 'BTC',
  target_currency text NOT NULL,
  rate numeric NOT NULL,
  source text NOT NULL DEFAULT 'api', -- api, manual
  fetched_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz DEFAULT (now() + interval '5 minutes') NOT NULL,
  
  UNIQUE(base_currency, target_currency)
);

CREATE INDEX IF NOT EXISTS idx_currency_rates_target ON currency_rates(target_currency);
CREATE INDEX IF NOT EXISTS idx_currency_rates_expires ON currency_rates(expires_at);

-- 9. Insert initial currency rates (will be updated by API)
INSERT INTO currency_rates (base_currency, target_currency, rate, source) 
VALUES 
  ('BTC', 'USD', 97000, 'initial'),
  ('BTC', 'EUR', 91000, 'initial'),
  ('BTC', 'CHF', 86000, 'initial'),
  ('BTC', 'GBP', 78000, 'initial'),
  ('BTC', 'SATS', 100000000, 'fixed')
ON CONFLICT (base_currency, target_currency) DO NOTHING;



















