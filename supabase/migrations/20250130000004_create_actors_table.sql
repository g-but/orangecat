-- =============================================
-- CREATE ACTORS TABLE
-- 
-- Unified ownership model: users and groups are both "actors"
-- who can own entities. This simplifies ownership checks and
-- enables future extensibility (e.g., AI agents as actors).
-- =============================================

-- Step 1: Create actors table
CREATE TABLE IF NOT EXISTS actors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type text NOT NULL CHECK (actor_type IN ('user', 'group')),
  
  -- Only one set based on actor_type
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  
  -- Display data (cached for performance)
  display_name text NOT NULL,
  avatar_url text,
  slug text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT actor_type_check CHECK (
    (actor_type = 'user' AND user_id IS NOT NULL AND group_id IS NULL) OR
    (actor_type = 'group' AND group_id IS NOT NULL AND user_id IS NULL)
  )
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_actors_user_id ON actors(user_id) WHERE actor_type = 'user';
CREATE INDEX IF NOT EXISTS idx_actors_group_id ON actors(group_id) WHERE actor_type = 'group';
CREATE INDEX IF NOT EXISTS idx_actors_slug ON actors(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_actors_type ON actors(actor_type);

-- Step 3: Enable RLS
ALTER TABLE actors ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own actor record
DROP POLICY IF EXISTS "Users can view their own actor" ON actors;
CREATE POLICY "Users can view their own actor" ON actors
  FOR SELECT USING (
    (actor_type = 'user' AND user_id = auth.uid()) OR
    (actor_type = 'group' AND group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    ))
  );

-- Public actors (public groups) are viewable by everyone
DROP POLICY IF EXISTS "Public groups are viewable" ON actors;
CREATE POLICY "Public groups are viewable" ON actors
  FOR SELECT USING (
    actor_type = 'group' AND group_id IN (
      SELECT id FROM groups WHERE is_public = true
    )
  );

-- Users can create their own actor record
DROP POLICY IF EXISTS "Users can create their own actor" ON actors;
CREATE POLICY "Users can create their own actor" ON actors
  FOR INSERT WITH CHECK (
    actor_type = 'user' AND user_id = auth.uid()
  );

-- Group founders/admins can create group actors
DROP POLICY IF EXISTS "Group admins can create group actor" ON actors;
CREATE POLICY "Group admins can create group actor" ON actors
  FOR INSERT WITH CHECK (
    actor_type = 'group' AND group_id IN (
      SELECT group_id FROM group_members 
      WHERE user_id = auth.uid() AND role IN ('founder', 'admin')
    )
  );

-- Step 4: Create updated_at trigger
DROP TRIGGER IF EXISTS update_actors_updated_at ON actors;
CREATE TRIGGER update_actors_updated_at
  BEFORE UPDATE ON actors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

