-- =============================================
-- ADD TASK NOTIFICATION TYPES
--
-- Adds new notification types for the task management system:
-- - task_attention: Task needs attention
-- - task_request: Someone requested you for a task
-- - task_completed: A task you created was completed
-- - task_broadcast: Broadcast request to all team members
--
-- Created: 2026-02-05
-- =============================================

-- Step 1: Drop the existing CHECK constraint on type
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Step 2: Add new CHECK constraint with task notification types
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    -- Original types
    'follow',
    'payment',
    'project_funded',
    'message',
    'comment',
    'like',
    'mention',
    'system',
    -- Task management types
    'task_attention',
    'task_request',
    'task_completed',
    'task_broadcast'
  ));

-- Step 3: Ensure action_url column exists (should already exist, but be safe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'action_url'
  ) THEN
    ALTER TABLE notifications ADD COLUMN action_url text;
  END IF;
END $$;

-- Step 4: Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
