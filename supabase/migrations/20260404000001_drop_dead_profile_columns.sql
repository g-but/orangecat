-- Phase 1B: Drop dead profile columns
--
-- These columns were never updated after initial insert (always 0/null).
-- Reduces profiles from 63 to ~43 columns.
--
-- Must recreate views that depend on display_name before dropping it.

-- Step 1: Drop views that depend on profiles.display_name
DROP VIEW IF EXISTS community_timeline_no_duplicates CASCADE;
DROP VIEW IF EXISTS enriched_timeline_events CASCADE;

-- Step 2: Recreate community_timeline view using profiles.name instead of display_name
CREATE OR REPLACE VIEW community_timeline_no_duplicates AS
SELECT DISTINCT ON (te.id) te.id,
    te.event_type, te.actor_id, te.subject_type, te.subject_id,
    te.title, te.description, te.visibility, te.event_timestamp,
    te.created_at, te.updated_at, te.metadata,
    COALESCE((SELECT count(*)::integer FROM timeline_likes WHERE event_id = te.id), 0) AS like_count,
    COALESCE((SELECT count(*)::integer FROM timeline_shares WHERE original_event_id = te.id), 0) AS share_count,
    COALESCE((SELECT count(*)::integer FROM timeline_comments WHERE event_id = te.id), 0) AS comment_count,
    jsonb_build_object('id', p.id, 'username', p.username, 'display_name', p.name, 'avatar_url', p.avatar_url) AS actor_data,
    CASE
        WHEN te.subject_type = 'profile' THEN jsonb_build_object('id', sp.id, 'type', 'profile', 'username', sp.username, 'display_name', sp.name)
        WHEN te.subject_type = 'project' THEN jsonb_build_object('id', pr.id, 'type', 'project', 'title', pr.title)
        ELSE NULL::jsonb
    END AS subject_data
FROM (((timeline_events te
    LEFT JOIN profiles p ON p.id = te.actor_id)
    LEFT JOIN profiles sp ON sp.id = te.subject_id AND te.subject_type = 'profile')
    LEFT JOIN projects pr ON pr.id = te.subject_id AND te.subject_type = 'project')
WHERE te.is_deleted = false AND te.visibility = 'public' AND te.is_cross_post_duplicate = false
    AND NOT (te.metadata ? 'original_post_id')
ORDER BY te.id, te.event_timestamp DESC;

-- Step 3: Recreate enriched_timeline view using profiles.name
CREATE OR REPLACE VIEW enriched_timeline_events AS
SELECT te.id, te.event_type, te.event_subtype, te.actor_id, te.actor_type,
    te.subject_type, te.subject_id, te.target_type, te.target_id,
    te.title, te.description, te.content, te.amount_sats, te.amount_btc,
    te.quantity, te.visibility, te.is_featured, te.event_timestamp,
    te.created_at, te.updated_at, te.metadata, te.tags,
    te.parent_event_id, te.thread_id, te.is_deleted,
    jsonb_build_object('id', actor.id, 'username', actor.username, 'full_name', actor.name,
        'avatar_url', actor.avatar_url, 'display_name', actor.name, 'bio', actor.bio,
        'created_at', actor.created_at) AS actor_data,
    CASE te.subject_type
        WHEN 'profile' THEN jsonb_build_object('id', sp.id, 'username', sp.username, 'full_name', sp.name,
            'avatar_url', sp.avatar_url, 'display_name', sp.name, 'bio', sp.bio, 'type', 'profile')
        WHEN 'project' THEN jsonb_build_object('id', spr.id, 'title', spr.title, 'status', spr.status,
            'description', spr.description, 'category', spr.category, 'type', 'project')
        ELSE NULL::jsonb
    END AS subject_data,
    CASE te.target_type
        WHEN 'profile' THEN jsonb_build_object('id', tp.id, 'username', tp.username,
            'avatar_url', tp.avatar_url, 'display_name', tp.name, 'type', 'profile')
        WHEN 'project' THEN jsonb_build_object('id', tpr.id, 'title', tpr.title, 'status', tpr.status,
            'category', tpr.category, 'type', 'project')
        ELSE NULL::jsonb
    END AS target_data,
    0 AS like_count, 0 AS comment_count, 0 AS share_count
FROM (((((timeline_events te
    LEFT JOIN profiles actor ON te.actor_id = actor.id)
    LEFT JOIN profiles sp ON te.subject_type = 'profile' AND te.subject_id = sp.id)
    LEFT JOIN projects spr ON te.subject_type = 'project' AND te.subject_id = spr.id)
    LEFT JOIN profiles tp ON te.target_type = 'profile' AND te.target_id = tp.id)
    LEFT JOIN projects tpr ON te.target_type = 'project' AND te.target_id = tpr.id)
WHERE NOT te.is_deleted;

-- Step 4: Drop the dead columns
ALTER TABLE profiles
  DROP COLUMN IF EXISTS follower_count,
  DROP COLUMN IF EXISTS following_count,
  DROP COLUMN IF EXISTS profile_views,
  DROP COLUMN IF EXISTS login_count,
  DROP COLUMN IF EXISTS campaign_count,
  DROP COLUMN IF EXISTS total_raised,
  DROP COLUMN IF EXISTS total_donated,
  DROP COLUMN IF EXISTS bitcoin_balance,
  DROP COLUMN IF EXISTS lightning_balance,
  DROP COLUMN IF EXISTS theme_preferences,
  DROP COLUMN IF EXISTS custom_css,
  DROP COLUMN IF EXISTS profile_color,
  DROP COLUMN IF EXISTS profile_badges,
  DROP COLUMN IF EXISTS cover_image_url,
  DROP COLUMN IF EXISTS two_factor_enabled,
  DROP COLUMN IF EXISTS display_name;
