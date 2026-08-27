-- Drop the hosted-sites read policy and its indexes.
--
-- 20260827090000 opened `group_features` rows with feature_key = 'site' to anon,
-- so a website published from a group profile could be loaded by a stranger.
-- That feature has been removed: a site is its own repository, deployed on its
-- own, exactly like every other site in this studio. OrangeCat is not the host.
--
-- Deleting the migration file does not undo a policy that already ran on
-- production, and an RLS policy granting anonymous SELECT is not the kind of
-- thing to leave lying around because "nothing writes that row any more". The
-- rows are gone; the grant should go with them.
--
-- `group_features_select` (members only) is untouched and remains the only
-- policy on the table, which is where this started.

DROP POLICY IF EXISTS group_features_select_site_anon ON public.group_features;

DROP INDEX IF EXISTS public.group_features_site_custom_domain_idx;
DROP INDEX IF EXISTS public.group_features_site_alias_hosts_idx;
