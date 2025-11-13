-- Migration: Enable Open Timeline Posting for Reputation System
-- Created: 2025-11-13
-- Purpose: Allow anyone to post on any timeline for transparency and reputation
-- This enables:
--   - Users can call out projects/people on their timelines
--   - Community accountability and transparency
--   - Reputation-based system where authenticity is verified by community

BEGIN;

-- Drop the restrictive policy that only allows self-posting
DROP POLICY IF EXISTS "Users can create timeline events" ON timeline_events;

-- Create new open policy that allows anyone to post anywhere
-- Actor = WHO is writing the post (must be authenticated)
-- Subject = WHOSE timeline it appears on (profile, project, etc.)
CREATE POLICY "Anyone can post on any timeline"
  ON timeline_events FOR INSERT
  WITH CHECK (
    -- Must be authenticated
    auth.uid() IS NOT NULL
    -- Actor must be the authenticated user (can't impersonate)
    AND auth.uid() = actor_id
    -- System events allowed
    OR actor_type = 'system'
  );

-- Add policy for reading timeline events
-- Users should be able to see public and followers-only events
DROP POLICY IF EXISTS "Anyone can view public timeline events" ON timeline_events;

CREATE POLICY "Anyone can view public timeline events"
  ON timeline_events FOR SELECT
  USING (
    -- Public events visible to everyone
    visibility = 'public'
    AND NOT is_deleted
    -- Or user's own events
    OR actor_id = auth.uid()
    -- Or events on user's own timeline
    OR subject_id = auth.uid()
    -- Private events only visible to actor
    OR (visibility = 'private' AND actor_id = auth.uid())
  );

-- Add comment explaining the reputation system
COMMENT ON POLICY "Anyone can post on any timeline" ON timeline_events IS
  'Open reputation system: Anyone can post on any timeline (profile/project) for transparency and accountability. Actor must be authenticated user - no impersonation allowed.';

COMMIT;
