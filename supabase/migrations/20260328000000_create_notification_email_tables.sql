-- =============================================
-- CREATE NOTIFICATION EMAIL TABLES
--
-- Two new tables to support email notifications:
-- 1. notification_preferences: per-user email settings
-- 2. notification_email_log: delivery tracking + frequency capping
-- =============================================

-- Step 1: Notification Preferences (per-user email settings)
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Per-category toggles
  economic_emails BOOLEAN NOT NULL DEFAULT true,
  social_emails BOOLEAN NOT NULL DEFAULT true,
  group_emails BOOLEAN NOT NULL DEFAULT true,
  progress_emails BOOLEAN NOT NULL DEFAULT true,
  reengagement_emails BOOLEAN NOT NULL DEFAULT true,

  -- Digest frequency
  digest_frequency TEXT NOT NULL DEFAULT 'weekly'
    CHECK (digest_frequency IN ('daily', 'weekly', 'never')),

  -- Per-type overrides (sparse map of type -> boolean)
  type_overrides JSONB NOT NULL DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One row per user
  UNIQUE(user_id)
);

-- Step 2: Email delivery log (for frequency capping + audit)
CREATE TABLE IF NOT EXISTS notification_email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  email_address TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent', 'bounced', 'complained', 'failed')),
  resend_id TEXT,        -- Resend message ID for tracking
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 3: Indexes
CREATE INDEX idx_notification_preferences_user
  ON notification_preferences(user_id);

CREATE INDEX idx_notification_email_log_user
  ON notification_email_log(user_id);

CREATE INDEX idx_notification_email_log_user_type
  ON notification_email_log(user_id, notification_type);

CREATE INDEX idx_notification_email_log_sent_at
  ON notification_email_log(sent_at DESC);

-- For frequency cap queries: recent emails per user per type
CREATE INDEX idx_notification_email_log_cap
  ON notification_email_log(user_id, notification_type, sent_at DESC);

-- Step 4: Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_email_log ENABLE ROW LEVEL SECURITY;

-- Step 5: RLS Policies for notification_preferences

-- Users can read their own preferences
CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Step 6: RLS Policies for notification_email_log

-- Users can view their own email log
CREATE POLICY "Users can view own email log"
  ON notification_email_log FOR SELECT
  USING (user_id = auth.uid());

-- Only service role can insert email log entries (server-side only)
-- No INSERT policy for regular users — admin client handles inserts

-- Step 7: Updated_at trigger for preferences
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();
