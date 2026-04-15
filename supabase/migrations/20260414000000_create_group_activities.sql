-- Create group_activities table for tracking group-level activity events
-- Referenced by src/services/groups/queries/activities.ts and src/services/groups/utils/activity.ts

CREATE TABLE IF NOT EXISTS group_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_group_activities_group_id ON group_activities(group_id);
CREATE INDEX idx_group_activities_user_id ON group_activities(user_id);
CREATE INDEX idx_group_activities_activity_type ON group_activities(activity_type);
CREATE INDEX idx_group_activities_created_at ON group_activities(created_at DESC);

ALTER TABLE group_activities ENABLE ROW LEVEL SECURITY;

-- Group members can view activities
CREATE POLICY "Group members can view activities"
  ON group_activities FOR SELECT
  USING (
    group_id IN (
      SELECT gm.group_id FROM group_members gm
      WHERE gm.user_id = auth.uid()
    )
  );

-- Group members can create activities for their own actions
CREATE POLICY "Group members can create activities"
  ON group_activities FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT gm.group_id FROM group_members gm
      WHERE gm.user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );
