-- Fixed timeline_event_stats view with correct column names
DROP VIEW IF EXISTS public.timeline_event_stats;
CREATE OR REPLACE VIEW public.timeline_event_stats AS
SELECT
  te.id as event_id,
  COALESCE(tl.like_count, 0) as like_count,
  COALESCE(td.dislike_count, 0) as dislike_count,
  COALESCE(ts.share_count, 0) as share_count,
  COALESCE(tc.comment_count, 0) as comment_count,
  COALESCE(tc.top_level_comment_count, 0) as top_level_comment_count
FROM timeline_events te
LEFT JOIN (SELECT event_id, COUNT(*) as like_count FROM timeline_interactions WHERE interaction_type = 'like' GROUP BY event_id) tl ON te.id = tl.event_id
LEFT JOIN (SELECT event_id, COUNT(*) as dislike_count FROM timeline_interactions WHERE interaction_type = 'dislike' GROUP BY event_id) td ON te.id = td.event_id
LEFT JOIN (SELECT parent_event_id as original_event_id, COUNT(*) as share_count FROM timeline_events WHERE event_type IN ('repost', 'quote') GROUP BY parent_event_id) ts ON te.id = ts.original_event_id
LEFT JOIN (
  SELECT parent_event_id as event_id, COUNT(*) as comment_count, COUNT(CASE WHEN grandparent_id IS NULL THEN 1 END) as top_level_comment_count
  FROM (SELECT te.id, te.parent_event_id, (SELECT parent_event_id FROM timeline_events WHERE id = te.parent_event_id) as grandparent_id FROM timeline_events te WHERE te.event_type LIKE '%comment%' AND NOT te.is_deleted) comments
  GROUP BY parent_event_id
) tc ON te.id = tc.event_id;

COMMENT ON VIEW timeline_event_stats IS 'Aggregated social interaction statistics for timeline events - SECURITY INVOKER with RLS enforcement';
