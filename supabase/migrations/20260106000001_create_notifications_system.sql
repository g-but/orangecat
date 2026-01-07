-- =============================================
-- CREATE NOTIFICATIONS SYSTEM
--
-- Real notification system to replace mock data.
-- Notifications are triggered by events like follows,
-- payments, comments, mentions, and system announcements.
-- =============================================

-- Step 1: Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who receives this notification
  recipient_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- What triggered it
  type text NOT NULL CHECK (type IN (
    'follow',           -- Someone followed you
    'payment',          -- Payment received
    'project_funded',   -- Project reached milestone
    'message',          -- New message notification
    'comment',          -- Someone commented on your post
    'like',             -- Someone liked your post
    'mention',          -- Someone mentioned you
    'system'            -- Platform announcements from OrangeCat
  )),

  -- Content
  title text NOT NULL,
  message text,
  action_url text,           -- Where to navigate on click

  -- Source (who/what triggered it)
  source_actor_id uuid REFERENCES actors(id) ON DELETE SET NULL,
  source_entity_type text,   -- 'project', 'post', 'message', etc.
  source_entity_id uuid,

  -- State
  read boolean DEFAULT false,
  read_at timestamptz,

  -- Metadata for type-specific data (amount, currency, etc.)
  metadata jsonb DEFAULT '{}',

  created_at timestamptz DEFAULT now()
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Step 3: Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS Policies

-- Users can only view their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (recipient_user_id = auth.uid());

-- Users can update (mark as read) their own notifications
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (recipient_user_id = auth.uid());

-- Users can delete their own notifications
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (recipient_user_id = auth.uid());

-- System can insert notifications (via service role or triggers)
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Step 5: Enable real-time for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Step 6: Create helper function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
  p_recipient_user_id uuid,
  p_type text,
  p_title text,
  p_message text DEFAULT NULL,
  p_action_url text DEFAULT NULL,
  p_source_actor_id uuid DEFAULT NULL,
  p_source_entity_type text DEFAULT NULL,
  p_source_entity_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
) RETURNS uuid AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO notifications (
    recipient_user_id,
    type,
    title,
    message,
    action_url,
    source_actor_id,
    source_entity_type,
    source_entity_id,
    metadata
  ) VALUES (
    p_recipient_user_id,
    p_type,
    p_title,
    p_message,
    p_action_url,
    p_source_actor_id,
    p_source_entity_type,
    p_source_entity_id,
    p_metadata
  ) RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create trigger for follow notifications
CREATE OR REPLACE FUNCTION notify_on_follow() RETURNS TRIGGER AS $$
DECLARE
  v_follower_name text;
  v_follower_actor_id uuid;
BEGIN
  -- Get follower info
  SELECT
    COALESCE(p.display_name, p.username, 'Someone'),
    a.id
  INTO v_follower_name, v_follower_actor_id
  FROM profiles p
  LEFT JOIN actors a ON a.user_id = p.id
  WHERE p.id = NEW.follower_id;

  -- Create notification for the followed user
  PERFORM create_notification(
    NEW.following_id,                              -- recipient
    'follow',                                      -- type
    v_follower_name || ' followed you',           -- title
    NULL,                                          -- message
    '/profiles/' || NEW.follower_id,              -- action_url
    v_follower_actor_id,                          -- source_actor_id
    'user',                                        -- source_entity_type
    NEW.follower_id                               -- source_entity_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on follows table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'follows') THEN
    DROP TRIGGER IF EXISTS trigger_notify_on_follow ON follows;
    CREATE TRIGGER trigger_notify_on_follow
      AFTER INSERT ON follows
      FOR EACH ROW
      EXECUTE FUNCTION notify_on_follow();
  END IF;
END $$;

-- Step 8: Create trigger for timeline interactions (likes, comments)
CREATE OR REPLACE FUNCTION notify_on_timeline_interaction() RETURNS TRIGGER AS $$
DECLARE
  v_actor_name text;
  v_actor_id uuid;
  v_event_owner_id uuid;
  v_notification_type text;
  v_title text;
BEGIN
  -- Get actor info
  SELECT
    COALESCE(p.display_name, p.username, 'Someone'),
    a.id
  INTO v_actor_name, v_actor_id
  FROM profiles p
  LEFT JOIN actors a ON a.user_id = p.id
  WHERE p.id = NEW.user_id;

  -- Get event owner
  SELECT user_id INTO v_event_owner_id
  FROM timeline_events
  WHERE id = NEW.event_id;

  -- Don't notify yourself
  IF v_event_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Determine notification type
  IF NEW.interaction_type = 'like' THEN
    v_notification_type := 'like';
    v_title := v_actor_name || ' liked your post';
  ELSIF NEW.interaction_type = 'comment' THEN
    v_notification_type := 'comment';
    v_title := v_actor_name || ' commented on your post';
  ELSE
    RETURN NEW;
  END IF;

  -- Create notification
  PERFORM create_notification(
    v_event_owner_id,                             -- recipient
    v_notification_type,                          -- type
    v_title,                                      -- title
    NULL,                                         -- message
    '/timeline?post=' || NEW.event_id,           -- action_url
    v_actor_id,                                   -- source_actor_id
    'timeline_event',                             -- source_entity_type
    NEW.event_id                                  -- source_entity_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on timeline_interactions table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'timeline_interactions') THEN
    DROP TRIGGER IF EXISTS trigger_notify_on_timeline_interaction ON timeline_interactions;
    CREATE TRIGGER trigger_notify_on_timeline_interaction
      AFTER INSERT ON timeline_interactions
      FOR EACH ROW
      EXECUTE FUNCTION notify_on_timeline_interaction();
  END IF;
END $$;

-- Step 9: Create OrangeCat system actor (for system messages)
-- Using a fixed UUID so it can be referenced consistently
INSERT INTO actors (id, actor_type, user_id, display_name, avatar_url, slug)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'user',
  NULL,
  'OrangeCat',
  '/images/orangecat-logo.svg',
  'orangecat-system'
)
ON CONFLICT (id) DO UPDATE SET
  display_name = 'OrangeCat',
  avatar_url = '/images/orangecat-logo.svg',
  slug = 'orangecat-system';

-- Step 10: Function to send system notifications
CREATE OR REPLACE FUNCTION send_system_notification(
  p_recipient_user_id uuid,
  p_title text,
  p_message text DEFAULT NULL,
  p_action_url text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
) RETURNS uuid AS $$
BEGIN
  RETURN create_notification(
    p_recipient_user_id,
    'system',
    p_title,
    p_message,
    p_action_url,
    '00000000-0000-0000-0000-000000000001',  -- OrangeCat actor
    'system',
    NULL,
    p_metadata
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
