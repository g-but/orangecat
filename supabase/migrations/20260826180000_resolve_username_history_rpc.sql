-- Resolve a retired handle through an RPC, not a query-string filter.
--
-- PostgREST reads `+` in a query string as a space, and supabase-js sends the
-- character raw. So `.eq('old_username', 'butaeff+ocauth2')` searches for
-- "butaeff ocauth2" and finds nothing:
--
--   ...&old_username=eq.butaeff+ocauth2    -> []
--   ...&old_username=eq.butaeff%2Bocauth2  -> [{...}]
--
-- Verified against production 2026-08-26. It is not hypothetical: two live
-- profiles carry a '+' (legacy handles minted from email local parts, back
-- when the address went in verbatim), and for those the profile redirect
-- returned 404 and the Lightning-address fallback could not find its owner —
-- exactly the silent breakage profile_username_history exists to prevent.
--
-- An RPC takes its argument in a JSON body, so no character needs escaping and
-- no future handle can be mangled by the transport. Same reasoning as the rest
-- of this table: it decides where a payment goes, so the lookup has to be exact
-- for every input, not for the convenient ones.

CREATE OR REPLACE FUNCTION public.resolve_username_history(handle text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT profile_id
  FROM public.profile_username_history
  WHERE old_username = lower(btrim(handle))
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.resolve_username_history(text) IS
  'Profile id behind a retired handle, or null. Called instead of a PostgREST filter because a query string mangles "+" into a space.';

-- Public on purpose: resolving an old handle is exactly as public as resolving
-- a current one — both the profile page and the LNURL endpoint are
-- unauthenticated — and it returns an id, never a list.
GRANT EXECUTE ON FUNCTION public.resolve_username_history(text) TO anon, authenticated, service_role;
