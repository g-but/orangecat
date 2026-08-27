-- Hosted sites: let the public read the fact that a site is published.
--
-- A hosted site is a `group_features` row with feature_key = 'site'. No new
-- table: that row already carries group_id, enabled, an audit column and a
-- `config` jsonb, and `src/config/group-features.ts` already treats "adding a
-- feature" as the way a group gains a capability. A website is a capability.
--
-- THE PROBLEM THIS FIXES
--
-- `group_features_select` restricts SELECT to members of the group. That is
-- right for treasury and voting, and wrong for a website: the entire purpose of
-- substrata.orangecat.ch is that a stranger can load it. Without this policy a
-- published site is invisible to exactly the audience it exists for, and the
-- app would have to answer "is this site published?" with a service-role client
-- — which moves a public/private decision out of the database and into code
-- that can drift from it.
--
-- So the database keeps the answer. A site row is world-readable when, and only
-- when, it is switched on AND its group is public. Turning `enabled` off, or
-- making the group private, unpublishes the website in the same instant — one
-- fact, one place.
--
-- Nothing else about group_features changes: every other feature_key stays
-- members-only, because the existing policy is unmodified and policies are ORed.

CREATE POLICY group_features_select_site_anon ON public.group_features
  FOR SELECT
  TO anon, authenticated
  USING (
    feature_key = 'site'
    AND enabled = true
    AND EXISTS (
      SELECT 1
      FROM public.groups g
      WHERE g.id = group_features.group_id
        AND g.is_public = true
    )
  );

COMMENT ON POLICY group_features_select_site_anon ON public.group_features IS
  'A published hosted site is public by definition — see src/config/hosted-site.ts. Scoped to feature_key = ''site'' so every other feature stays members-only.';

-- Resolving a CUSTOM domain is the one lookup that cannot be a pattern match:
-- given "substrata.ch", which site is that? Both indexes are partial on the
-- site rows, so they cost nothing for the other feature keys.
CREATE INDEX IF NOT EXISTS group_features_site_custom_domain_idx
  ON public.group_features ((config ->> 'customDomain'))
  WHERE feature_key = 'site';

CREATE INDEX IF NOT EXISTS group_features_site_alias_hosts_idx
  ON public.group_features USING gin ((config -> 'aliasHosts') jsonb_path_ops)
  WHERE feature_key = 'site';
