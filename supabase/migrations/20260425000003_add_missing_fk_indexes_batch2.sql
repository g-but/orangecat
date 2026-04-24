-- Add indexes for unindexed foreign key columns (batch 2).
-- FK columns without indexes cause sequential scans on JOIN operations
-- and ON DELETE CASCADE enforcement.

-- entity_wallets: created_by references auth.users
CREATE INDEX IF NOT EXISTS idx_entity_wallets_created_by
  ON public.entity_wallets (created_by);

-- group_features: enabled_by references auth.users
CREATE INDEX IF NOT EXISTS idx_group_features_enabled_by
  ON public.group_features (enabled_by);

-- group_members: invited_by references auth.users
CREATE INDEX IF NOT EXISTS idx_group_members_invited_by
  ON public.group_members (invited_by);

-- group_proposals: proposer_id references auth.users
CREATE INDEX IF NOT EXISTS idx_group_proposals_proposer_id
  ON public.group_proposals (proposer_id);

-- group_wallets: created_by references auth.users
CREATE INDEX IF NOT EXISTS idx_group_wallets_created_by
  ON public.group_wallets (created_by);

-- projects: creator_id (separate from user_id)
CREATE INDEX IF NOT EXISTS idx_projects_creator_id
  ON public.projects (creator_id);

-- task_attention_flags: resolved_by and resolved_by_completion_id
CREATE INDEX IF NOT EXISTS idx_task_attention_flags_resolved_by
  ON public.task_attention_flags (resolved_by);

CREATE INDEX IF NOT EXISTS idx_task_attention_flags_resolved_by_completion_id
  ON public.task_attention_flags (resolved_by_completion_id);

-- task_projects: created_by references auth.users
CREATE INDEX IF NOT EXISTS idx_task_projects_created_by
  ON public.task_projects (created_by);

-- task_requests: completion_id, requested_by, responded_by
CREATE INDEX IF NOT EXISTS idx_task_requests_completion_id
  ON public.task_requests (completion_id);

CREATE INDEX IF NOT EXISTS idx_task_requests_requested_by
  ON public.task_requests (requested_by);

CREATE INDEX IF NOT EXISTS idx_task_requests_responded_by
  ON public.task_requests (responded_by);

-- tasks: completed_by references auth.users
CREATE INDEX IF NOT EXISTS idx_tasks_completed_by
  ON public.tasks (completed_by);

-- wishlist_feedback: fulfillment_proof_id
CREATE INDEX IF NOT EXISTS idx_wishlist_feedback_fulfillment_proof_id
  ON public.wishlist_feedback (fulfillment_proof_id);
