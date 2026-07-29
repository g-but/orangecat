-- Allow the 'tip_dead_end' notification type: when a visitor opens the tip
-- dialog for someone who can't receive yet, the would-be recipient is told
-- "someone tried to tip you — turn on receiving" (deduped, growth loop).
-- Extends the list from 20260721000000 (which added 'match').

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (
  type = ANY (ARRAY[
    'follow','payment','project_funded','message','comment','like','mention',
    'system','task_attention','task_request','task_completed','task_broadcast',
    'match','tip_dead_end'
  ]::text[])
);
