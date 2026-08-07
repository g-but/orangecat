-- profiles outlived their users. Make that structurally impossible.
--
-- `public.profiles` had NO foreign key at all — `profiles.id` held an
-- auth.users id by convention only. So deleting a user removed the auth row and
-- left the profile behind forever: a public page, a username still taken, and a
-- row counted by every "how many users do we have" query.
--
-- Measured in production 2026-08-06: 115 orphaned profiles, 113 of them from
-- the per-run `e2e-reset-*` fixtures that CI has minted since 2026-06-12.
-- scripts/test-setup/refresh-e2e-reset-tokens.mjs was doing its job — it calls
-- admin.deleteUser on throwaways older than a day — but with no cascade the
-- profile survived every time. The result: 136 of 185 profile rows (73%) were
-- test accounts, so the platform's own signup numbers were mostly synthetic and
-- the real figure (39, of which 3 in the last 30 days) was invisible.
--
-- No real end user has been orphaned yet: the other 2 are our own
-- `memtest_*` / `selfhost-verify+*` fixtures. But nothing prevented it, and
-- account deletion is a data-protection promise — "delete my account" must not
-- leave a public profile standing.
--
-- The cascade is the fix, not a cleanup script. A delete path you have to
-- remember to call is a delete path that eventually is not called; a foreign key
-- cannot be forgotten. `on_auth_user_created` → `handle_new_user` already
-- creates the profile AFTER the auth row, so ordering satisfies the constraint,
-- and the reverse direction (a profile with no user) is exactly what we want
-- rejected.
--
-- NOT VALID deliberately: it enforces the rule for every future insert and
-- makes ON DELETE CASCADE fire from now on, WITHOUT requiring the 115 existing
-- orphans to be deleted first. Purging live production rows is a separate,
-- explicit decision — this migration must not smuggle it in. Once those rows
-- are cleared, `ALTER TABLE public.profiles VALIDATE CONSTRAINT
-- profiles_id_fkey;` promotes it to fully validated.

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
  NOT VALID;

-- The detection half. auth.users is not reachable through PostgREST, so the
-- nightly invariant gate (scripts/check-data-invariants.mjs) cannot see an
-- orphan by querying tables — it needs this. SECURITY DEFINER to read the auth
-- schema, locked to service_role so nothing user-facing can enumerate it.
--
-- Returns a count, not rows: the gate only needs to know the invariant broke,
-- and a count cannot leak usernames of deleted accounts.
CREATE OR REPLACE FUNCTION public.count_orphaned_profiles()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT count(*)::bigint
  FROM public.profiles p
  WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id);
$$;

REVOKE ALL ON FUNCTION public.count_orphaned_profiles() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.count_orphaned_profiles() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.count_orphaned_profiles() TO service_role;
