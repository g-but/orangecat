-- Add user_id column to projects table for compatibility
-- The API expects user_id but projects table uses creator_id

ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Copy creator_id to user_id for existing records
UPDATE projects SET user_id = creator_id WHERE user_id IS NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);


