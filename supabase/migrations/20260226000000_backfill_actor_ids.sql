-- Migration: Backfill actor_id on all entity tables
-- Purpose: Create actors for users missing them, populate actor_id on existing entities
-- This completes the actor_id migration so all entities use unified ownership

-- Step 1: Add actor_id to research_entities (missed in original migration)
ALTER TABLE research_entities ADD COLUMN IF NOT EXISTS actor_id uuid REFERENCES actors(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_research_entities_actor_id ON research_entities(actor_id);

-- Step 2: Create actors for all users who don't have one yet
INSERT INTO actors (actor_type, user_id, display_name, avatar_url, slug)
SELECT
  'user',
  p.id,
  COALESCE(p.name, p.username, split_part(p.email, '@', 1), 'User'),
  p.avatar_url,
  COALESCE(p.username, p.id::text)
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM actors a WHERE a.user_id = p.id AND a.actor_type = 'user'
)
ON CONFLICT DO NOTHING;

-- Step 3: Backfill actor_id on all entity tables
-- Projects
UPDATE projects p
SET actor_id = a.id
FROM actors a
WHERE a.user_id = p.user_id
  AND a.actor_type = 'user'
  AND p.actor_id IS NULL;

-- Products
UPDATE user_products up
SET actor_id = a.id
FROM actors a
WHERE a.user_id = up.user_id
  AND a.actor_type = 'user'
  AND up.actor_id IS NULL;

-- Services
UPDATE user_services us
SET actor_id = a.id
FROM actors a
WHERE a.user_id = us.user_id
  AND a.actor_type = 'user'
  AND us.actor_id IS NULL;

-- Causes
UPDATE user_causes uc
SET actor_id = a.id
FROM actors a
WHERE a.user_id = uc.user_id
  AND a.actor_type = 'user'
  AND uc.actor_id IS NULL;

-- AI Assistants
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_assistants' AND column_name = 'user_id') THEN
    EXECUTE '
      UPDATE ai_assistants ai
      SET actor_id = a.id
      FROM actors a
      WHERE a.user_id = ai.user_id
        AND a.actor_type = ''user''
        AND ai.actor_id IS NULL
    ';
  END IF;
END $$;

-- Loans
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loans') THEN
    EXECUTE '
      UPDATE loans l
      SET actor_id = a.id
      FROM actors a
      WHERE a.user_id = l.user_id
        AND a.actor_type = ''user''
        AND l.actor_id IS NULL
    ';
  END IF;
END $$;

-- Assets
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_assets' AND column_name = 'owner_id') THEN
    EXECUTE '
      UPDATE user_assets ua
      SET actor_id = a.id
      FROM actors a
      WHERE a.user_id = ua.owner_id
        AND a.actor_type = ''user''
        AND ua.actor_id IS NULL
    ';
  END IF;
END $$;

-- Events
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'user_id') THEN
    EXECUTE '
      UPDATE events e
      SET actor_id = a.id
      FROM actors a
      WHERE a.user_id = e.user_id
        AND a.actor_type = ''user''
        AND e.actor_id IS NULL
    ';
  END IF;
END $$;

-- Research entities
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'research_entities' AND column_name = 'user_id') THEN
    EXECUTE '
      UPDATE research_entities re
      SET actor_id = a.id
      FROM actors a
      WHERE a.user_id = re.user_id
        AND a.actor_type = ''user''
        AND re.actor_id IS NULL
    ';
  END IF;
END $$;

-- Step 4: Log results for verification
DO $$
DECLARE
  total_actors integer;
  null_projects integer;
  null_products integer;
  null_services integer;
  null_causes integer;
BEGIN
  SELECT count(*) INTO total_actors FROM actors WHERE actor_type = 'user';
  SELECT count(*) INTO null_projects FROM projects WHERE actor_id IS NULL;
  SELECT count(*) INTO null_products FROM user_products WHERE actor_id IS NULL;
  SELECT count(*) INTO null_services FROM user_services WHERE actor_id IS NULL;
  SELECT count(*) INTO null_causes FROM user_causes WHERE actor_id IS NULL;

  RAISE NOTICE 'Actor backfill complete: % user actors, % projects without actor_id, % products without actor_id, % services without actor_id, % causes without actor_id',
    total_actors, null_projects, null_products, null_services, null_causes;
END $$;
