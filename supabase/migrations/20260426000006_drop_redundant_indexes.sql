-- Drop redundant indexes that are subsumed by unique constraints or broader composites.
-- The remaining ~160 unused indexes are future-use performance indexes on a low-traffic
-- dev database and should NOT be dropped until production query patterns are established.

-- profiles.username: non-unique index duplicates the unique constraint index
DROP INDEX IF EXISTS public.idx_profiles_username;

-- transparency_scores(entity_id, entity_type): duplicates unique_entity_score
DROP INDEX IF EXISTS public.idx_transparency_scores_entity;

-- notification_preferences.user_id: duplicates the unique constraint index
DROP INDEX IF EXISTS public.idx_notification_preferences_user;

-- conversations.last_message_at: exact duplicate of idx_conversations_last_message_at
DROP INDEX IF EXISTS public.idx_conversations_last_message;

-- timeline_likes.user_id: subsumed by idx_timeline_likes_user (user_id, created_at)
DROP INDEX IF EXISTS public.idx_timeline_likes_user_id;

-- timeline_comments.user_id: subsumed by idx_timeline_comments_user (user_id, created_at)
DROP INDEX IF EXISTS public.idx_timeline_comments_user_id;

-- message_read_receipts.message_id: subsumed by idx_message_read_receipts_message_user (message_id, user_id)
DROP INDEX IF EXISTS public.idx_message_read_receipts_message_id;

-- notification_email_log.user_id: subsumed by cap index (user_id, notification_type, sent_at)
DROP INDEX IF EXISTS public.idx_notification_email_log_user;

-- notification_email_log(user_id, notification_type): subsumed by cap index
DROP INDEX IF EXISTS public.idx_notification_email_log_user_type;

-- timeline_events.thread_id: subsumed by idx_timeline_thread (thread_id, event_timestamp)
DROP INDEX IF EXISTS public.idx_timeline_events_thread_id;

-- assets.actor_id: subsumed by idx_assets_show_on_profile (actor_id, show_on_profile)
DROP INDEX IF EXISTS public.idx_assets_actor_id;
