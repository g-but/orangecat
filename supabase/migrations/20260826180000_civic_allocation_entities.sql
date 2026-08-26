-- Civic allocation: the two entities that let a person direct their own public money.
--
-- WHY: OrangeCat's taxonomy covers every voluntary economic relation — gift,
-- funding, lending, investing — but has no noun for the one transfer nearly
-- every person makes and none of them controls: the money that goes to
-- government. The claim this ships is narrow and concrete: a person should be
-- able to say what share of their taxes and contributions goes to their
-- municipality, their canton/state, and their federation — and to say it in
-- public, in a form a governance system can count.
--
-- Solon is where such a claim becomes binding (a signed vote, a decision
-- document). OrangeCat is where it is DECLARED and MEASURED. That split is the
-- whole architecture: this migration stores declared preference, Solon converts
-- volume of declared preference into a decision, and the jurisdiction receives.
--
-- Three tables, two of them entities:
--   jurisdictions          — the civic recipient (a government at a level)
--   civic_allocations      — an actor's standing directive (entity type `allocation`)
--   civic_allocation_lines — the lines of one directive (child rows, not an entity)
--
-- NOT reusing `groups` for jurisdictions. A government body differs from a group
-- in four schema-level ways, not cosmetic ones: you belong to it by residence
-- rather than by invitation; it is hierarchical and territorial (parent chain +
-- ISO codes); its trust model is inverted (a group is trusted because you know
-- who founded it, a government page is worthless unless it is provably the real
-- body or explicitly marked unclaimed); and it publishes a budget rather than a
-- fundraising goal.
--
-- NOT reusing `allocation_policies`. That table is the Cat's platform-wide
-- spending leash, governed by Solon for everyone at once. This is per-actor and
-- per-person. The name collision is unfortunate and deliberate on both sides —
-- hence the `civic_` prefix here.

-- ==========================================================================
-- jurisdictions — the civic recipient
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.jurisdictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Set only when the body itself claims and proves the page. NULL means the
  -- row is a directory entry created by the community, which is the normal
  -- starting state — see verification_status below.
  actor_id uuid REFERENCES public.actors(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  title text NOT NULL,
  slug text UNIQUE,
  description text,

  -- Ordered by `level_rank` below. Five rather than the colloquial three because
  -- "local / state / federal" is one country's shape: many places have a
  -- district tier (Bezirk, county, arrondissement) and some sit under a
  -- supranational body.
  level text NOT NULL CHECK (level IN ('local', 'district', 'regional', 'national', 'supranational')),

  -- The containing body. Enforced strictly upward by the trigger below, which
  -- is also why no cycle check is needed: an edge may only ever point at a
  -- strictly higher rank, so a cycle cannot be formed.
  parent_id uuid REFERENCES public.jurisdictions(id) ON DELETE SET NULL,

  country_code text CHECK (country_code IS NULL OR country_code ~ '^[A-Z]{2}$'),  -- ISO 3166-1 alpha-2
  region_code text,                                                               -- ISO 3166-2, e.g. CH-ZH
  locality text,
  population integer CHECK (population IS NULL OR population >= 0),

  official_url text,

  -- Published budget, in `currency` (a fiscal budget is denominated in the
  -- jurisdiction's own money; BTC is how contributions may arrive, not how a
  -- national budget is stated).
  currency text NOT NULL DEFAULT 'CHF',
  annual_budget numeric(20, 2) CHECK (annual_budget IS NULL OR annual_budget >= 0),
  budget_year integer,
  budget_url text,

  -- Payment rails. Universal by design (principle 3): a municipality is far
  -- likelier to publish an IBAN than a Lightning address, and both belong here.
  bitcoin_address text,
  lightning_address text,
  payment_methods jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Trust. `unclaimed` is the default and the honest one: anyone may add
  -- "Stadt Zürich" to the directory, and until the body itself proves control,
  -- the page states that plainly and routes no money. An allocation may still
  -- name an unclaimed jurisdiction — that is a declaration of intent, which is
  -- the entire point, and it is what gives the body a reason to claim the page.
  verification_status text NOT NULL DEFAULT 'unclaimed'
    CHECK (verification_status IN ('unclaimed', 'pending', 'verified', 'disputed')),
  verified_at timestamptz,
  verification_evidence_url text,

  -- Its governance body on Solon, when it has one.
  solon_org_id text,

  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  tags text[] NOT NULL DEFAULT '{}',
  avatar_url text,
  cover_image_url text,
  show_on_profile boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- A verified body must carry the evidence and the timestamp. Without this the
  -- badge is just a string anyone with write access can set, and the badge is
  -- the only thing separating a real treasury from a squatted page.
  CONSTRAINT jurisdictions_verified_requires_proof CHECK (
    verification_status <> 'verified'
    OR (verified_at IS NOT NULL AND verification_evidence_url IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS jurisdictions_parent_idx ON public.jurisdictions (parent_id);
CREATE INDEX IF NOT EXISTS jurisdictions_actor_idx ON public.jurisdictions (actor_id);
CREATE INDEX IF NOT EXISTS jurisdictions_level_idx ON public.jurisdictions (level);
CREATE INDEX IF NOT EXISTS jurisdictions_place_idx ON public.jurisdictions (country_code, region_code);
CREATE INDEX IF NOT EXISTS jurisdictions_status_idx ON public.jurisdictions (status);

COMMENT ON TABLE public.jurisdictions IS
  'Government bodies as civic recipients: level + parent chain + territory + published budget. verification_status=unclaimed is the normal starting state — a directory entry that may be allocated toward but cannot be paid.';
COMMENT ON COLUMN public.jurisdictions.parent_id IS
  'The containing body, always at a strictly higher level_rank (enforced by jurisdictions_check_parent_rank). The strictness is what makes cycles impossible.';

-- Rank of a level, used to enforce that a parent strictly contains its child.
CREATE OR REPLACE FUNCTION public.jurisdiction_level_rank(p_level text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_level
    WHEN 'local' THEN 1
    WHEN 'district' THEN 2
    WHEN 'regional' THEN 3
    WHEN 'national' THEN 4
    WHEN 'supranational' THEN 5
  END;
$$;

CREATE OR REPLACE FUNCTION public.jurisdictions_check_parent_rank()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent_level text;
BEGIN
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.parent_id = NEW.id THEN
    RAISE EXCEPTION 'A jurisdiction cannot be its own parent';
  END IF;

  SELECT level INTO parent_level FROM public.jurisdictions WHERE id = NEW.parent_id;
  IF parent_level IS NULL THEN
    RAISE EXCEPTION 'Parent jurisdiction % does not exist', NEW.parent_id;
  END IF;

  IF public.jurisdiction_level_rank(parent_level)
     <= public.jurisdiction_level_rank(NEW.level) THEN
    RAISE EXCEPTION
      'Parent jurisdiction must be at a higher level than the child (got parent=%, child=%)',
      parent_level, NEW.level;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS jurisdictions_parent_rank ON public.jurisdictions;
CREATE TRIGGER jurisdictions_parent_rank
  BEFORE INSERT OR UPDATE OF parent_id, level ON public.jurisdictions
  FOR EACH ROW EXECUTE FUNCTION public.jurisdictions_check_parent_rank();

-- ==========================================================================
-- civic_allocations — an actor's standing directive
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.civic_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- actor, not user: a group pays taxes and holds a treasury too, and the
  -- actor system is what makes "my split" and "our split" the same feature.
  actor_id uuid NOT NULL REFERENCES public.actors(id) ON DELETE CASCADE,

  title text NOT NULL,
  description text,

  -- What is being split. `tax` is the statutory obligation, `voluntary` is money
  -- given on top of it, `mixed` is one directive covering both. The distinction
  -- matters legally and it matters to the reader of the public page.
  basis text NOT NULL DEFAULT 'tax'
    CHECK (basis IN ('tax', 'voluntary', 'mixed')),

  cadence text NOT NULL DEFAULT 'annual'
    CHECK (cadence IN ('per_payment', 'monthly', 'quarterly', 'annual')),

  period_start date,
  period_end date,

  -- The obligation this directive splits, when the person chooses to state it.
  -- Optional on purpose: the split is meaningful as a percentage even from
  -- someone who will not publish what they pay.
  reference_amount numeric(20, 2) CHECK (reference_amount IS NULL OR reference_amount >= 0),
  currency text NOT NULL DEFAULT 'CHF',

  -- The person's own place. Anchors what "local / regional / national" MEAN for
  -- this directive, and lets the Cat propose the chain rather than asking the
  -- person to search for their own municipality.
  residency_jurisdiction_id uuid REFERENCES public.jurisdictions(id) ON DELETE SET NULL,

  -- The civic argument. Not decoration: a split without a stated reason is a
  -- preference, a split with one is an argument other people can weigh, and
  -- arguments are what a governance layer can actually act on.
  rationale text,

  -- Optional Bitcoin signature over the canonical content, so a published
  -- directive can be counted by Solon without trusting OrangeCat's database.
  -- Same canonicalisation as src/services/solon/canonical.ts.
  content_hash text,
  signing_address text,
  signature text,
  signed_at timestamptz,
  solon_proposal_id text,

  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  visibility text NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'unlisted', 'private')),
  show_on_profile boolean NOT NULL DEFAULT true,
  tags text[] NOT NULL DEFAULT '{}',

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT civic_allocations_period_ordered CHECK (
    period_start IS NULL OR period_end IS NULL OR period_end >= period_start
  ),
  CONSTRAINT civic_allocations_signature_complete CHECK (
    signature IS NULL
    OR (signing_address IS NOT NULL AND content_hash IS NOT NULL AND signed_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS civic_allocations_actor_idx ON public.civic_allocations (actor_id);
CREATE INDEX IF NOT EXISTS civic_allocations_residency_idx
  ON public.civic_allocations (residency_jurisdiction_id);
CREATE INDEX IF NOT EXISTS civic_allocations_public_idx
  ON public.civic_allocations (status, visibility)
  WHERE status = 'active' AND visibility = 'public';

COMMENT ON TABLE public.civic_allocations IS
  'An actor''s standing directive for where their taxes and contributions go. Lines live in civic_allocation_lines and must sum to 100% before the directive can leave draft.';

-- ==========================================================================
-- civic_allocation_lines — one share of one directive
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.civic_allocation_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_id uuid NOT NULL
    REFERENCES public.civic_allocations(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,

  share_percent numeric(6, 3) NOT NULL
    CHECK (share_percent > 0 AND share_percent <= 100),

  -- Recipient, exactly one of three shapes (same polymorphic pattern as
  -- stakeholder_relationships). A line may point at a government, at anything
  -- already on OrangeCat, or at something that is not here yet.
  --
  -- Allowing non-government lines is the deliberate part. The moment a person
  -- can put "10% to the youth centre down the road" beside "20% federal", the
  -- distinction between a tax and a contribution stops being a difference in
  -- kind and becomes a difference in who decided — which is the argument.
  jurisdiction_id uuid REFERENCES public.jurisdictions(id) ON DELETE RESTRICT,
  recipient_entity_type text,   -- an EntityType value from the registry
  recipient_entity_id uuid,     -- soft reference into that entity's table
  external_name text,
  external_url text,

  note text,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT civic_allocation_lines_one_recipient CHECK (
    (
      (jurisdiction_id IS NOT NULL)::int
      + (recipient_entity_type IS NOT NULL AND recipient_entity_id IS NOT NULL)::int
      + (external_name IS NOT NULL)::int
    ) = 1
  ),
  -- Half a soft reference points at nothing.
  CONSTRAINT civic_allocation_lines_entity_ref_complete CHECK (
    (recipient_entity_type IS NULL) = (recipient_entity_id IS NULL)
  ),
  UNIQUE (allocation_id, position)
);

CREATE INDEX IF NOT EXISTS civic_allocation_lines_allocation_idx
  ON public.civic_allocation_lines (allocation_id);
CREATE INDEX IF NOT EXISTS civic_allocation_lines_jurisdiction_idx
  ON public.civic_allocation_lines (jurisdiction_id);
CREATE INDEX IF NOT EXISTS civic_allocation_lines_entity_idx
  ON public.civic_allocation_lines (recipient_entity_type, recipient_entity_id);

-- The one arithmetic rule: a directive that is not in draft must sum to exactly
-- 100%. Enforced only outside draft on purpose — editing a split necessarily
-- passes through unbalanced intermediate states, and a per-row constraint would
-- make it impossible to move five points from one line to another. The rule a
-- person can hold in their head is: you cannot ACTIVATE an unbalanced split,
-- and you cannot unbalance an active one.
CREATE OR REPLACE FUNCTION public.civic_allocation_assert_balanced(p_allocation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  alloc_status text;
  total numeric;
BEGIN
  SELECT status INTO alloc_status
    FROM public.civic_allocations WHERE id = p_allocation_id;

  -- Deleted parent (cascade) or still a draft: nothing to enforce.
  IF alloc_status IS NULL OR alloc_status = 'draft' THEN
    RETURN;
  END IF;

  SELECT COALESCE(SUM(share_percent), 0) INTO total
    FROM public.civic_allocation_lines WHERE allocation_id = p_allocation_id;

  IF total <> 100 THEN
    RAISE EXCEPTION
      'Allocation % cannot be % because its lines total % percent, not 100',
      p_allocation_id, alloc_status, total
      USING HINT = 'Move it back to draft to edit the split, or adjust the shares so they total 100.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.civic_allocation_lines_balance_check()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.civic_allocation_assert_balanced(
    COALESCE(NEW.allocation_id, OLD.allocation_id)
  );
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS civic_allocation_lines_balanced ON public.civic_allocation_lines;
CREATE CONSTRAINT TRIGGER civic_allocation_lines_balanced
  AFTER INSERT OR UPDATE OR DELETE ON public.civic_allocation_lines
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.civic_allocation_lines_balance_check();

CREATE OR REPLACE FUNCTION public.civic_allocations_balance_check()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.civic_allocation_assert_balanced(NEW.id);
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS civic_allocations_balanced ON public.civic_allocations;
CREATE CONSTRAINT TRIGGER civic_allocations_balanced
  AFTER INSERT OR UPDATE OF status ON public.civic_allocations
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.civic_allocations_balance_check();

-- ==========================================================================
-- updated_at
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.civic_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS jurisdictions_touch ON public.jurisdictions;
CREATE TRIGGER jurisdictions_touch
  BEFORE UPDATE ON public.jurisdictions
  FOR EACH ROW EXECUTE FUNCTION public.civic_touch_updated_at();

DROP TRIGGER IF EXISTS civic_allocations_touch ON public.civic_allocations;
CREATE TRIGGER civic_allocations_touch
  BEFORE UPDATE ON public.civic_allocations
  FOR EACH ROW EXECUTE FUNCTION public.civic_touch_updated_at();

-- ==========================================================================
-- RLS
-- ==========================================================================
--
-- `owned_actor_ids()` is the ownership predicate every policy below shares.
-- The established pattern in this schema (circles, wishlists) inlines
-- `actor_id IN (SELECT id FROM actors WHERE user_id = auth.uid())`, which
-- silently covers ONLY user actors. That is a real gap here: the entity
-- economic taxonomy makes a group a first-class economic actor, and a group
-- pays taxes and holds a treasury exactly like a person does. A directive owned
-- by a group actor would be invisible to its own members under the inlined
-- form. Naming the predicate once also means the group-membership rule is
-- stated in one place rather than copied into eight policies.

CREATE OR REPLACE FUNCTION public.owned_actor_ids()
RETURNS TABLE (id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id FROM public.actors a
   WHERE a.actor_type = 'user' AND a.user_id = auth.uid()
  UNION
  SELECT a.id FROM public.actors a
    JOIN public.group_members gm ON gm.group_id = a.group_id
   WHERE a.actor_type = 'group'
     AND gm.user_id = auth.uid()
     AND gm.role IN ('founder', 'owner', 'admin');
$$;

COMMENT ON FUNCTION public.owned_actor_ids() IS
  'Actor ids the calling user may act as: their own user actor, plus group actors where they hold founder/owner/admin. Used by civic allocation RLS.';

GRANT EXECUTE ON FUNCTION public.owned_actor_ids() TO authenticated;

ALTER TABLE public.jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.civic_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.civic_allocation_lines ENABLE ROW LEVEL SECURITY;

-- Jurisdictions are a public directory: everyone reads active rows.
DROP POLICY IF EXISTS "Jurisdictions are publicly readable" ON public.jurisdictions;
CREATE POLICY "Jurisdictions are publicly readable"
  ON public.jurisdictions FOR SELECT
  USING (status = 'active');

DROP POLICY IF EXISTS "Owners read their own jurisdictions" ON public.jurisdictions;
CREATE POLICY "Owners read their own jurisdictions"
  ON public.jurisdictions FOR SELECT
  USING (
    created_by = auth.uid()
    OR actor_id IN (SELECT id FROM public.owned_actor_ids())
  );

DROP POLICY IF EXISTS "Authenticated users can add jurisdictions" ON public.jurisdictions;
CREATE POLICY "Authenticated users can add jurisdictions"
  ON public.jurisdictions FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Editing is limited to the creator or the claiming body. Promotion to
-- `verified` is NOT grantable here: the constraint above demands evidence, and
-- the evidence is reviewed server-side with the service role.
DROP POLICY IF EXISTS "Creators and claimants can edit jurisdictions" ON public.jurisdictions;
CREATE POLICY "Creators and claimants can edit jurisdictions"
  ON public.jurisdictions FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR actor_id IN (SELECT id FROM public.owned_actor_ids())
  );

-- A public directive is public; everything else is the owner's.
DROP POLICY IF EXISTS "Public allocations are readable" ON public.civic_allocations;
CREATE POLICY "Public allocations are readable"
  ON public.civic_allocations FOR SELECT
  USING (visibility = 'public' AND status = 'active');

DROP POLICY IF EXISTS "Owners read their allocations" ON public.civic_allocations;
CREATE POLICY "Owners read their allocations"
  ON public.civic_allocations FOR SELECT
  USING (actor_id IN (SELECT id FROM public.owned_actor_ids()));

DROP POLICY IF EXISTS "Owners write their allocations" ON public.civic_allocations;
CREATE POLICY "Owners write their allocations"
  ON public.civic_allocations FOR ALL
  TO authenticated
  USING (actor_id IN (SELECT id FROM public.owned_actor_ids()))
  WITH CHECK (actor_id IN (SELECT id FROM public.owned_actor_ids()));

-- Lines inherit the visibility of their directive, exactly.
DROP POLICY IF EXISTS "Allocation lines follow their allocation" ON public.civic_allocation_lines;
CREATE POLICY "Allocation lines follow their allocation"
  ON public.civic_allocation_lines FOR SELECT
  USING (
    allocation_id IN (
      SELECT id FROM public.civic_allocations
      WHERE (visibility = 'public' AND status = 'active')
         OR actor_id IN (SELECT id FROM public.owned_actor_ids())
    )
  );

DROP POLICY IF EXISTS "Owners write their allocation lines" ON public.civic_allocation_lines;
CREATE POLICY "Owners write their allocation lines"
  ON public.civic_allocation_lines FOR ALL
  TO authenticated
  USING (
    allocation_id IN (
      SELECT id FROM public.civic_allocations
      WHERE actor_id IN (SELECT id FROM public.owned_actor_ids())
    )
  )
  WITH CHECK (
    allocation_id IN (
      SELECT id FROM public.civic_allocations
      WHERE actor_id IN (SELECT id FROM public.owned_actor_ids())
    )
  );

GRANT ALL ON public.jurisdictions TO service_role;
GRANT ALL ON public.civic_allocations TO service_role;
GRANT ALL ON public.civic_allocation_lines TO service_role;

-- ==========================================================================
-- Seed: the Swiss chain, so the directory is not empty on day one
-- ==========================================================================
--
-- Public facts only (name, level, ISO codes, official site). Every row is
-- `unclaimed` with no payment rails: these are directory entries a person can
-- point an allocation at, NOT a claim that any of these bodies has agreed to
-- receive anything. Each becomes payable only when the body itself claims the
-- page and the evidence is reviewed.

INSERT INTO public.jurisdictions (id, title, slug, level, parent_id, country_code, region_code, locality, official_url, currency, description)
VALUES
  (
    '11111111-0000-4000-8000-000000000001',
    'Schweizerische Eidgenossenschaft',
    'ch-confederation',
    'national', NULL, 'CH', NULL, NULL,
    'https://www.admin.ch', 'CHF',
    'The Swiss Confederation — the federal tier. Defence, foreign affairs, federal taxation and social insurance.'
  ),
  (
    '11111111-0000-4000-8000-000000000002',
    'Kanton Zürich',
    'ch-zh-canton',
    'regional', '11111111-0000-4000-8000-000000000001', 'CH', 'CH-ZH', NULL,
    'https://www.zh.ch', 'CHF',
    'The canton of Zürich — the regional tier. Education, health, policing, cantonal taxation.'
  ),
  (
    '11111111-0000-4000-8000-000000000003',
    'Stadt Zürich',
    'ch-zh-zurich',
    'local', '11111111-0000-4000-8000-000000000002', 'CH', 'CH-ZH', 'Zürich',
    'https://www.stadt-zuerich.ch', 'CHF',
    'The city of Zürich — the local tier. Schools, transit, utilities, social services, municipal taxation.'
  )
ON CONFLICT (id) DO NOTHING;
