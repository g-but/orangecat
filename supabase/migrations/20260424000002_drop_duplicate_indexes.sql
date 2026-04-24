-- Drop duplicate indexes identified by performance advisors.
-- These are exact duplicates of other indexes on the same column set with the same filter.

-- messages: idx_messages_unread is identical to idx_messages_active
-- Both: btree(conversation_id, created_at DESC) WHERE is_deleted = false
DROP INDEX IF EXISTS public.idx_messages_unread;

-- timeline_dislikes: idx_timeline_dislikes_event_id is identical to idx_timeline_dislikes_event
-- Both: btree(event_id)
DROP INDEX IF EXISTS public.idx_timeline_dislikes_event_id;

-- timeline_likes: idx_timeline_likes_event_id is identical to idx_timeline_likes_event
-- Both: btree(event_id)
DROP INDEX IF EXISTS public.idx_timeline_likes_event_id;
