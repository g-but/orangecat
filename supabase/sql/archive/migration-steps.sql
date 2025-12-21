-- Step 1: Create post_visibility table
CREATE TABLE IF NOT EXISTS post_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES timeline_events(id) ON DELETE CASCADE,
  timeline_type TEXT NOT NULL CHECK (timeline_type IN ('profile', 'project', 'community')),
  timeline_owner_id UUID,
  added_by_id UUID NOT NULL REFERENCES auth.users(id),
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, timeline_type, timeline_owner_id)
);
