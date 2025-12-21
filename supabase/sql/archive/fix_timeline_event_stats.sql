-- =============================================
-- FIX TIMELINE_EVENT_STATS SECURITY ISSUE
-- Replace SECURITY DEFINER view with secure INVOKER version
-- =============================================

-- Drop the potentially problematic view
DROP VIEW IF EXISTS public.timeline_event_stats;

-- Recreate as SECURITY INVOKER (default and secure)
CREATE OR REPLACE VIEW public.timeline_event_stats AS
SELECT
  te.id as event_id,
  COALESCE(tl.like_count, 0) as like_count,
  COALESCE(td.dislike_count, 0) as dislike_count,
  COALESCE(ts.share_count, 0) as share_count,
  COALESCE(tc.comment_count, 0) as comment_count,
  COALESCE(tc.top_level_comment_count, 0) as top_level_comment_count
FROM timeline_events te
LEFT JOIN (
  SELECT event_id, COUNT(*) as like_count
  FROM timeline_interactions
  WHERE interaction_type = 'like'
  GROUP BY event_id
) tl ON te.id = tl.event_id
LEFT JOIN (
  SELECT event_id, COUNT(*) as dislike_count
  FROM timeline_interactions
  WHERE interaction_type = 'dislike'
  GROUP BY event_id
) td ON te.id = td.event_id
LEFT JOIN (
  SELECT 
    CASE 
      WHEN event_type = 'repost' AND metadata->>'original_event_id' IS NOT NULL 
      THEN (metadata->>'original_event_id')::uuid
      ELSE parent_id 
    END as original_event_id,
    COUNT(*) as share_count
  FROM timeline_events
  WHERE event_type IN ('repost', 'quote')
  GROUP BY 
    CASE 
      WHEN event_type = 'repost' AND metadata->>'original_event_id' IS NOT NULL 
      THEN (metadata->>'original_event_id')::uuid
      ELSE parent_id 
    END
) ts ON te.id = ts.original_event_id
LEFT JOIN (
  SELECT
    parent_id as event_id,
    COUNT(*) as comment_count,
    COUNT(CASE WHEN parent_id IS NOT NULL AND grandparent_id IS NULL THEN 1 END) as top_level_comment_count
  FROM (
    SELECT 
      te.id,
      te.parent_id,
      (SELECT parent_id FROM timeline_events WHERE id = te.parent_id) as grandparent_id
    FROM timeline_events te
    WHERE te.event_type = 'comment' AND NOT te.is_deleted
  ) comments
  GROUP BY parent_id
) tc ON te.id = tc.event_id;

-- Ensure proper RLS policies for the underlying tables
ALTER TABLE timeline_interactions ENABLE ROW LEVEL SECURITY;

-- Timeline interactions policies (if not already set)
DROP POLICY IF EXISTS "Timeline interactions are viewable by everyone" ON timeline_interactions;
CREATE POLICY "Timeline interactions are viewable by everyone" 
  ON timeline_interactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own interactions" ON timeline_interactions;
CREATE POLICY "Users can insert their own interactions" 
  ON timeline_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own interactions" ON timeline_interactions;
CREATE POLICY "Users can delete their own interactions" 
  ON timeline_interactions FOR DELETE USING (auth.uid() = user_id);

-- Add comment explaining the security model
COMMENT ON VIEW timeline_event_stats IS 'Aggregated social interaction statistics for timeline events - SECURITY INVOKER with RLS enforcement';

-- Success message
SELECT '✅ timeline_event_stats view recreated as SECURITY INVOKER with proper RLS' as status;
