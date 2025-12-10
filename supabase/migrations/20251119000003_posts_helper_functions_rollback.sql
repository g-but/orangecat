-- ROLLBACK: 20251119000003_posts_helper_functions
-- Generated: 2025-12-04T12:37:00.482Z
-- Source: 20251119000003_posts_helper_functions.sql

DROP FUNCTION IF EXISTS get_community_timeline;
DROP FUNCTION IF EXISTS get_profile_timeline;
DROP FUNCTION IF EXISTS get_project_timeline;
DROP FUNCTION IF EXISTS create_post_with_visibility;
-- MANUAL: Review data inserted into posts
-- MANUAL: Review data inserted into post_visibility

-- Rollback completed: 20251119000003_posts_helper_functions