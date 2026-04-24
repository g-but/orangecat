-- Consolidate multiple permissive policies - batch 1
-- Remove exact duplicates and subset policies (no semantic change)

-- loans INSERT: exact duplicate (same WITH CHECK condition)
DROP POLICY IF EXISTS "Users can insert their own loans" ON public.loans;

-- profiles SELECT: exact duplicate (both qual = true)
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;

-- timeline_dislikes SELECT: exact duplicate (both qual = true)
DROP POLICY IF EXISTS "Users can view all timeline dislikes" ON public.timeline_dislikes;

-- timeline_likes SELECT: exact duplicate (both qual = true)
DROP POLICY IF EXISTS "Users can view all timeline likes" ON public.timeline_likes;

-- projects SELECT: projects_public_read covers (status='active' OR status='completed' OR user_id=auth.uid())
-- which already subsumes projects_select_active (status='active') and projects_select_own (user_id=auth.uid())
DROP POLICY IF EXISTS "projects_select_active" ON public.projects;
DROP POLICY IF EXISTS "projects_select_own" ON public.projects;

-- timeline_events INSERT: "Users can insert their own timeline events" (actor_id=auth.uid())
-- is a subset of "Users can create timeline events" (actor_id=auth.uid() OR actor_type='system')
DROP POLICY IF EXISTS "Users can insert their own timeline events" ON public.timeline_events;

-- group_members SELECT: "Public group members are viewable" is a subset of
-- "Group members can view other members" which already includes the public-group condition
DROP POLICY IF EXISTS "Public group members are viewable" ON public.group_members;
