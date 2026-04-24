-- Consolidate multiple permissive policies - batch 2
-- actors, ai_assistants, contributions

-- actors INSERT: merge "Group admins can create group actor" + "Users can create their own actor"
DROP POLICY IF EXISTS "Group admins can create group actor" ON public.actors;
DROP POLICY IF EXISTS "Users can create their own actor" ON public.actors;
CREATE POLICY "Actors can be created by users or group admins" ON public.actors
  FOR INSERT
  WITH CHECK (
    ((actor_type = 'user'::text) AND (user_id = (SELECT auth.uid() AS uid)))
    OR
    ((actor_type = 'group'::text) AND (group_id IN (
      SELECT group_members.group_id FROM group_members
      WHERE ((group_members.user_id = (SELECT auth.uid() AS uid))
        AND (group_members.role = ANY (ARRAY['founder'::text, 'admin'::text])))
    )))
  );

-- actors SELECT: merge 3 policies
DROP POLICY IF EXISTS "Public groups are viewable" ON public.actors;
DROP POLICY IF EXISTS "User actors are publicly viewable" ON public.actors;
DROP POLICY IF EXISTS "Users can view their own actor" ON public.actors;
CREATE POLICY "Actors are viewable by appropriate users" ON public.actors
  FOR SELECT
  USING (
    (actor_type = 'user'::text)
    OR
    ((actor_type = 'group'::text) AND (
      group_id IN (SELECT id FROM groups WHERE is_public = true)
      OR group_id IN (SELECT group_id FROM group_members WHERE user_id = (SELECT auth.uid() AS uid))
    ))
  );

-- ai_assistants SELECT: merge 2 policies
DROP POLICY IF EXISTS "Public AI assistants are viewable by everyone" ON public.ai_assistants;
DROP POLICY IF EXISTS "Users can view their own AI assistants" ON public.ai_assistants;
CREATE POLICY "AI assistants viewable if public or owned" ON public.ai_assistants
  FOR SELECT
  USING (
    ((status = 'active'::ai_assistant_status) AND (is_public = true))
    OR ((SELECT auth.uid() AS uid) = user_id)
  );

-- contributions SELECT: merge 3 policies
DROP POLICY IF EXISTS "Contributors view own" ON public.contributions;
DROP POLICY IF EXISTS "Entity owners view all contributions" ON public.contributions;
DROP POLICY IF EXISTS "Public view non-anonymous" ON public.contributions;
CREATE POLICY "Contributions viewable by contributors, owners, or if public" ON public.contributions
  FOR SELECT
  USING (
    (is_anonymous = false)
    OR (contributor_id = (SELECT auth.uid() AS uid))
    OR (EXISTS (
      SELECT 1 FROM actors a
      WHERE ((a.user_id = (SELECT auth.uid() AS uid))
        AND (
          ((contributions.entity_type = 'project'::text) AND (EXISTS (
            SELECT 1 FROM projects WHERE ((projects.id = contributions.entity_id) AND (projects.actor_id = a.id))
          )))
          OR ((contributions.entity_type = 'cause'::text) AND (EXISTS (
            SELECT 1 FROM user_causes WHERE ((user_causes.id = contributions.entity_id) AND (user_causes.actor_id = a.id))
          )))
          OR ((contributions.entity_type = 'research'::text) AND (EXISTS (
            SELECT 1 FROM research_entities WHERE ((research_entities.id = contributions.entity_id) AND (research_entities.user_id = (SELECT auth.uid() AS uid)))
          )))
        ))
    ))
  );
