-- =============================================
-- TASK MANAGEMENT SYSTEM
--
-- Self-reporting task management with:
-- - Task types: one-time, recurring scheduled, recurring as-needed
-- - Self-reporting model (anyone can complete, track WHO/WHAT/WHEN)
-- - Attention & request system (including broadcast to ALL teammates)
-- - In-app notifications with email readiness
-- - Analytics for fairness tracking
--
-- Created: 2026-02-05
-- =============================================

-- Step 1: Create task_projects table (for grouping tasks)
-- Note: Using task_projects to avoid conflict with existing projects table
CREATE TABLE IF NOT EXISTS task_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  target_date date,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 2: Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  title text NOT NULL,
  description text,
  instructions text,

  -- Task type (one-time, recurring scheduled, recurring as-needed)
  task_type text NOT NULL CHECK (task_type IN ('one_time', 'recurring_scheduled', 'recurring_as_needed')),

  -- Schedule (for recurring_scheduled)
  schedule_cron text,
  schedule_human text,  -- Human-readable schedule description

  -- Categorization
  category text NOT NULL CHECK (category IN ('cleaning', 'maintenance', 'admin', 'inventory', 'it', 'kitchen', 'workshop', 'logistics', 'other')),
  tags text[] DEFAULT '{}',

  -- Priority
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  -- Time estimate
  estimated_minutes integer,

  -- Current status
  current_status text NOT NULL DEFAULT 'idle' CHECK (current_status IN ('idle', 'needs_attention', 'requested', 'in_progress')),

  -- Completion (for one-time tasks)
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  completed_by uuid REFERENCES auth.users(id),

  -- Project grouping
  project_id uuid REFERENCES task_projects(id) ON DELETE SET NULL,

  -- Ownership & metadata
  created_by uuid NOT NULL REFERENCES auth.users(id),
  is_archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 3: Create task_completions table (history)
CREATE TABLE IF NOT EXISTS task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  completed_by uuid NOT NULL REFERENCES auth.users(id),
  completed_at timestamptz DEFAULT now(),
  notes text,
  duration_minutes integer,
  created_at timestamptz DEFAULT now()
);

-- Step 4: Create task_attention_flags table
CREATE TABLE IF NOT EXISTS task_attention_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  flagged_by uuid NOT NULL REFERENCES auth.users(id),
  message text,
  is_resolved boolean DEFAULT false,
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  resolved_by_completion_id uuid REFERENCES task_completions(id),
  created_at timestamptz DEFAULT now()
);

-- Step 5: Create task_requests table
-- requested_user_id = NULL means broadcast to all staff
CREATE TABLE IF NOT EXISTS task_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES auth.users(id),
  requested_user_id uuid REFERENCES auth.users(id),  -- NULL = broadcast to all
  is_broadcast boolean GENERATED ALWAYS AS (requested_user_id IS NULL) STORED,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  response_message text,
  responded_by uuid REFERENCES auth.users(id),  -- Who accepted (especially for broadcasts)
  completion_id uuid REFERENCES task_completions(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(current_status) WHERE NOT is_archived;
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category) WHERE NOT is_archived;
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(task_type) WHERE NOT is_archived;
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id) WHERE NOT is_archived;
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority) WHERE NOT is_archived AND current_status != 'idle';

CREATE INDEX IF NOT EXISTS idx_task_completions_task ON task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_user ON task_completions(completed_by);
CREATE INDEX IF NOT EXISTS idx_task_completions_date ON task_completions(completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_task_attention_flags_task ON task_attention_flags(task_id) WHERE NOT is_resolved;
CREATE INDEX IF NOT EXISTS idx_task_attention_flags_user ON task_attention_flags(flagged_by);

CREATE INDEX IF NOT EXISTS idx_task_requests_user ON task_requests(requested_user_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_task_requests_broadcast ON task_requests(is_broadcast) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_task_requests_task ON task_requests(task_id);

CREATE INDEX IF NOT EXISTS idx_task_projects_status ON task_projects(status);

-- Step 7: Create trigger function to reset task on completion
CREATE OR REPLACE FUNCTION reset_task_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Reset recurring tasks to idle
  UPDATE tasks
  SET current_status = 'idle',
      updated_at = now()
  WHERE id = NEW.task_id
  AND task_type != 'one_time';

  -- Mark one-time tasks as completed
  UPDATE tasks
  SET is_completed = true,
      completed_at = NEW.completed_at,
      completed_by = NEW.completed_by,
      current_status = 'idle',
      updated_at = now()
  WHERE id = NEW.task_id
  AND task_type = 'one_time';

  -- Resolve all open attention flags for this task
  UPDATE task_attention_flags
  SET is_resolved = true,
      resolved_by = NEW.completed_by,
      resolved_at = NEW.completed_at,
      resolved_by_completion_id = NEW.id
  WHERE task_id = NEW.task_id
  AND is_resolved = false;

  -- Complete all pending/accepted requests for this task
  UPDATE task_requests
  SET status = 'completed',
      completion_id = NEW.id,
      responded_by = COALESCE(responded_by, NEW.completed_by),
      updated_at = now()
  WHERE task_id = NEW.task_id
  AND status IN ('pending', 'accepted');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS task_completion_trigger ON task_completions;
CREATE TRIGGER task_completion_trigger
  AFTER INSERT ON task_completions
  FOR EACH ROW
  EXECUTE FUNCTION reset_task_on_completion();

-- Step 8: Create trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_task_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_task_updated_at();

DROP TRIGGER IF EXISTS task_requests_updated_at ON task_requests;
CREATE TRIGGER task_requests_updated_at
  BEFORE UPDATE ON task_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_task_updated_at();

DROP TRIGGER IF EXISTS task_projects_updated_at ON task_projects;
CREATE TRIGGER task_projects_updated_at
  BEFORE UPDATE ON task_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_task_updated_at();

-- Step 9: Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attention_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_projects ENABLE ROW LEVEL SECURITY;

-- Step 10: RLS Policies for tasks
-- All authenticated staff can view non-archived tasks
DROP POLICY IF EXISTS "Staff can view tasks" ON tasks;
CREATE POLICY "Staff can view tasks" ON tasks
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND NOT is_archived
  );

-- Task creator can view their archived tasks
DROP POLICY IF EXISTS "Creator can view archived tasks" ON tasks;
CREATE POLICY "Creator can view archived tasks" ON tasks
  FOR SELECT USING (
    created_by = auth.uid()
    AND is_archived = true
  );

-- Authenticated users can create tasks
DROP POLICY IF EXISTS "Authenticated users can create tasks" ON tasks;
CREATE POLICY "Authenticated users can create tasks" ON tasks
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
  );

-- Authenticated users can update tasks (self-report model)
DROP POLICY IF EXISTS "Authenticated users can update tasks" ON tasks;
CREATE POLICY "Authenticated users can update tasks" ON tasks
  FOR UPDATE USING (
    auth.uid() IS NOT NULL
  );

-- Only creator can archive (soft delete)
DROP POLICY IF EXISTS "Creator can archive tasks" ON tasks;
CREATE POLICY "Creator can archive tasks" ON tasks
  FOR UPDATE USING (
    created_by = auth.uid()
  )
  WITH CHECK (
    created_by = auth.uid()
  );

-- Step 11: RLS Policies for task_completions
-- All staff can view completions
DROP POLICY IF EXISTS "Staff can view completions" ON task_completions;
CREATE POLICY "Staff can view completions" ON task_completions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- All staff can create completions (self-report)
DROP POLICY IF EXISTS "Staff can create completions" ON task_completions;
CREATE POLICY "Staff can create completions" ON task_completions
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND completed_by = auth.uid()
  );

-- Step 12: RLS Policies for task_attention_flags
-- All staff can view flags
DROP POLICY IF EXISTS "Staff can view attention flags" ON task_attention_flags;
CREATE POLICY "Staff can view attention flags" ON task_attention_flags
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- All staff can create flags
DROP POLICY IF EXISTS "Staff can create attention flags" ON task_attention_flags;
CREATE POLICY "Staff can create attention flags" ON task_attention_flags
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND flagged_by = auth.uid()
  );

-- All staff can resolve flags (via trigger on completion)
DROP POLICY IF EXISTS "Staff can update attention flags" ON task_attention_flags;
CREATE POLICY "Staff can update attention flags" ON task_attention_flags
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Step 13: RLS Policies for task_requests
-- Users can view requests sent to them or broadcasts
DROP POLICY IF EXISTS "Users can view their requests" ON task_requests;
CREATE POLICY "Users can view their requests" ON task_requests
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND (
      requested_user_id = auth.uid()  -- Direct request
      OR requested_user_id IS NULL    -- Broadcast
      OR requested_by = auth.uid()    -- Requests I sent
    )
  );

-- All staff can create requests
DROP POLICY IF EXISTS "Staff can create requests" ON task_requests;
CREATE POLICY "Staff can create requests" ON task_requests
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND requested_by = auth.uid()
  );

-- Users can respond to requests sent to them
DROP POLICY IF EXISTS "Users can respond to requests" ON task_requests;
CREATE POLICY "Users can respond to requests" ON task_requests
  FOR UPDATE USING (
    auth.uid() IS NOT NULL
    AND (
      requested_user_id = auth.uid()  -- Direct request
      OR requested_user_id IS NULL    -- Can accept broadcast
    )
  );

-- Step 14: RLS Policies for task_projects
-- All staff can view projects
DROP POLICY IF EXISTS "Staff can view projects" ON task_projects;
CREATE POLICY "Staff can view projects" ON task_projects
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Authenticated users can create projects
DROP POLICY IF EXISTS "Authenticated users can create projects" ON task_projects;
CREATE POLICY "Authenticated users can create projects" ON task_projects
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
  );

-- Creator can update projects
DROP POLICY IF EXISTS "Creator can update projects" ON task_projects;
CREATE POLICY "Creator can update projects" ON task_projects
  FOR UPDATE USING (created_by = auth.uid());

-- Step 15: Extend notification types for task system
-- Check if notification type constraint exists and update it
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

  -- Add updated constraint with task notification types
  ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
      -- Existing types
      'follow', 'payment', 'project_funded', 'message', 'comment', 'like', 'mention', 'system',
      -- New task types
      'task_attention', 'task_request', 'task_completed', 'task_broadcast'
    ));
EXCEPTION
  WHEN undefined_table THEN
    -- notifications table doesn't exist yet, skip
    NULL;
END $$;

-- Step 16: Helper function to create task notifications
CREATE OR REPLACE FUNCTION create_task_notification(
  p_recipient_user_id uuid,
  p_type text,
  p_title text,
  p_message text DEFAULT NULL,
  p_task_id uuid DEFAULT NULL,
  p_source_user_id uuid DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_notification_id uuid;
  v_source_actor_id uuid;
BEGIN
  -- Get source actor if user provided
  IF p_source_user_id IS NOT NULL THEN
    SELECT id INTO v_source_actor_id
    FROM actors
    WHERE user_id = p_source_user_id
    LIMIT 1;
  END IF;

  -- Create notification
  INSERT INTO notifications (
    recipient_user_id,
    type,
    title,
    message,
    action_url,
    source_actor_id,
    source_entity_type,
    source_entity_id
  ) VALUES (
    p_recipient_user_id,
    p_type,
    p_title,
    p_message,
    CASE WHEN p_task_id IS NOT NULL
      THEN '/dashboard/tasks/' || p_task_id::text
      ELSE '/dashboard/tasks'
    END,
    v_source_actor_id,
    'task',
    p_task_id
  ) RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 17: Helper function to create broadcast task notification to all staff
CREATE OR REPLACE FUNCTION create_task_broadcast_notification(
  p_exclude_user_id uuid,
  p_type text,
  p_title text,
  p_message text DEFAULT NULL,
  p_task_id uuid DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_source_actor_id uuid;
BEGIN
  -- Get source actor
  IF p_exclude_user_id IS NOT NULL THEN
    SELECT id INTO v_source_actor_id
    FROM actors
    WHERE user_id = p_exclude_user_id
    LIMIT 1;
  END IF;

  -- Batch insert notifications for all users except sender
  -- Note: In production, you'd filter by is_staff or team membership
  INSERT INTO notifications (
    recipient_user_id,
    type,
    title,
    message,
    action_url,
    source_actor_id,
    source_entity_type,
    source_entity_id
  )
  SELECT
    u.id,
    p_type,
    p_title,
    p_message,
    CASE WHEN p_task_id IS NOT NULL
      THEN '/dashboard/tasks/' || p_task_id::text
      ELSE '/dashboard/tasks'
    END,
    v_source_actor_id,
    'task',
    p_task_id
  FROM auth.users u
  WHERE u.id != COALESCE(p_exclude_user_id, '00000000-0000-0000-0000-000000000000'::uuid)
  -- In production: AND u.id IN (SELECT user_id FROM team_members WHERE ...)
  ;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 18: Grant execute permissions
GRANT EXECUTE ON FUNCTION create_task_notification TO authenticated;
GRANT EXECUTE ON FUNCTION create_task_broadcast_notification TO authenticated;
