-- Stop minting public identities out of people's email addresses.
--
-- `handle_new_user()` set a new profile's PUBLIC username to
-- split_part(NEW.email, '@', 1), and fell back to the same value for the
-- display name. `/profiles/<username>` is served to anyone with no auth and
-- robots.txt has no /profiles rule, so every signup published its owner's
-- email local part as a crawlable handle. With a handful of common domains
-- that reconstructs the address.
--
-- Measured on production 2026-08-26 before this migration: 72 of 99 profiles
-- had `username = split_part(email, '@', 1)`, and the message picker's default
-- suggestion list showed them to any logged-in user — which is how it was
-- reported.
--
-- 20260818140000 already fixed the worse half (usernames that were the FULL
-- address) and added a CHECK forbidding '@'. It left the local-part derivation
-- in place, so this is the same leak one character shorter.
--
-- Two changes, both forward-only:
--
--   1. username is now derived from the user's id, which carries no personal
--      information. Users can still pick their own via PUT /api/profile.
--   2. name no longer falls back to the email local part. NULL is honest —
--      the UI already falls back to the username — whereas a display name
--      quietly set to someone's email prefix is the same leak wearing a
--      different label.
--
-- EXISTING ROWS ARE NOT RENAMED, deliberately. A username is also a Lightning
-- address (`<username>@orangecat.ch`, see .well-known/lnurlp and
-- /api/lnurlp/<username>/callback) and a public profile URL. Renaming the 72
-- affected accounts would break saved payment addresses and inbound links for
-- real people. That is a product decision with a migration path (opt-in
-- rename + alias retained for lnurlp + 301 on the old profile URL), not
-- something a schema migration should smuggle in.
--
-- Fixes a latent signup failure too: username is NOT NULL with a unique index,
-- and `ON CONFLICT (id) DO NOTHING` does not catch a username collision. Two
-- users with the same local part at different domains (mao@a.com, mao@b.com)
-- meant the second signup raised. An id-derived handle cannot collide.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, name, email, status, created_at, updated_at)
  VALUES (
    NEW.id,
    -- 12 hex chars of the uuid: unique by construction, and it says nothing
    -- about who the person is. Matches the app's own username pattern
    -- (^[a-zA-Z0-9_-]+$, src/lib/validation/base.ts).
    'user_' || left(replace(NEW.id::text, '-', ''), 12),
    -- OAuth display name if the provider gave one, else NULL. No email
    -- fallback: see the note above.
    NULLIF(COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name'
    ), ''),
    NEW.email,
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- The detection half, so this cannot regress unnoticed.
--
-- auth.users is not reachable through PostgREST, so the nightly invariant gate
-- (scripts/check-data-invariants.mjs) cannot see an email-derived handle by
-- querying tables — it needs this. Same shape as count_orphaned_profiles:
-- SECURITY DEFINER to read the auth schema, locked to service_role so nothing
-- user-facing can enumerate it, and it returns a COUNT rather than rows —
-- a list of "profiles whose handle is their email prefix" is precisely the
-- thing we are trying not to publish.
CREATE OR REPLACE FUNCTION public.count_email_derived_usernames()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT count(*)::bigint
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.username = split_part(u.email, '@', 1);
$$;

REVOKE ALL ON FUNCTION public.count_email_derived_usernames() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.count_email_derived_usernames() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.count_email_derived_usernames() TO service_role;

COMMENT ON FUNCTION public.count_email_derived_usernames() IS
  'How many profiles still publish their email local part as a public handle. A ratchet for check-data-invariants.mjs: it may fall or hold, never rise.';
