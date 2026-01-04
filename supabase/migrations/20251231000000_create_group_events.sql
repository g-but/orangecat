-- =============================================
-- GROUP EVENTS SYSTEM
--
-- Enables event management for groups:
-- - Create events (meetings, celebrations, assemblies)
-- - RSVP tracking
-- - Online/in-person/hybrid support
-- =============================================

-- Step 1: Create group_events table
CREATE TABLE IF NOT EXISTS group_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Information
  title text NOT NULL,
  description text,
  event_type text DEFAULT 'general' CHECK (event_type IN ('general', 'meeting', 'celebration', 'assembly')),
  
  -- Location
  location_type text DEFAULT 'online' CHECK (location_type IN ('online', 'in_person', 'hybrid')),
  location_details text, -- Address or video link
  
  -- Date & Time
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  timezone text DEFAULT 'UTC',
  
  -- Capacity & RSVP
  max_attendees integer,
  is_public boolean DEFAULT true, -- Non-members can see
  requires_rsvp boolean DEFAULT false,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 2: Create group_event_rsvps table
CREATE TABLE IF NOT EXISTS group_event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES group_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_group_events_group ON group_events(group_id);
CREATE INDEX IF NOT EXISTS idx_group_events_starts_at ON group_events(starts_at);
CREATE INDEX IF NOT EXISTS idx_group_events_creator ON group_events(creator_id);
CREATE INDEX IF NOT EXISTS idx_group_events_type ON group_events(event_type);
CREATE INDEX IF NOT EXISTS idx_group_event_rsvps_event ON group_event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_group_event_rsvps_user ON group_event_rsvps(user_id);
CREATE INDEX IF NOT EXISTS idx_group_event_rsvps_status ON group_event_rsvps(status);

-- Step 4: Enable RLS
ALTER TABLE group_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_event_rsvps ENABLE ROW LEVEL SECURITY;

-- Step 5: RLS Policies for group_events

-- Public events are viewable by anyone, private events by members only
CREATE POLICY "Public events are viewable" ON group_events
  FOR SELECT USING (
    is_public = true OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = group_events.group_id
      AND user_id = auth.uid()
    )
  );

-- Group members can create events
CREATE POLICY "Members can create events" ON group_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = group_events.group_id
      AND user_id = auth.uid()
    )
  );

-- Creators and admins can update events
CREATE POLICY "Creators and admins can update events" ON group_events
  FOR UPDATE USING (
    creator_id = auth.uid() OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = group_events.group_id
      AND user_id = auth.uid()
      AND role IN ('founder', 'admin')
    )
  );

-- Creators and admins can delete events
CREATE POLICY "Creators and admins can delete events" ON group_events
  FOR DELETE USING (
    creator_id = auth.uid() OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = group_events.group_id
      AND user_id = auth.uid()
      AND role IN ('founder', 'admin')
    )
  );

-- Step 6: RLS Policies for group_event_rsvps

-- Users can manage their own RSVPs
CREATE POLICY "Users can manage their RSVPs" ON group_event_rsvps
  FOR ALL USING (user_id = auth.uid());

-- Event attendees can view RSVPs for events they can see
CREATE POLICY "Event attendees can view RSVPs" ON group_event_rsvps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_events
      WHERE id = group_event_rsvps.event_id
      AND (
        is_public = true OR EXISTS (
          SELECT 1 FROM group_members
          WHERE group_id = group_events.group_id
          AND user_id = auth.uid()
        )
      )
    )
  );

-- Step 7: Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_group_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_group_events_updated_at
  BEFORE UPDATE ON group_events
  FOR EACH ROW
  EXECUTE FUNCTION update_group_events_updated_at();

CREATE OR REPLACE FUNCTION update_group_event_rsvps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_group_event_rsvps_updated_at
  BEFORE UPDATE ON group_event_rsvps
  FOR EACH ROW
  EXECUTE FUNCTION update_group_event_rsvps_updated_at();

-- =============================================
-- MIGRATION COMPLETE
--
-- Created:
-- - group_events table
-- - group_event_rsvps table
-- - RLS policies for secure access
-- - Indexes for performance
-- - Triggers for updated_at
--
-- Usage:
-- - Create event: INSERT INTO group_events
-- - RSVP: INSERT INTO group_event_rsvps
-- - Query: SELECT * FROM group_events WHERE group_id = ...
-- =============================================


