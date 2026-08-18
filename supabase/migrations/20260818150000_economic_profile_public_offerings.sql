-- Economic profile: public "offerings" slice + not_available_for scope field.
--
-- Two problems this fixes:
--
-- 1. user_economic_profile_select only allows `auth.uid() = user_id`, so
--    ProfileOfferings ("What I can offer" on /profiles/[username]) has been
--    unreachable for anyone except the profile owner since it shipped — every
--    visitor gets economicProfile = null and the section silently never
--    renders. This adds a narrow public view exposing only the fields that
--    were always meant to be public-facing (skills, assets, asked_for),
--    leaving the private ones (constraints, motivation, stage) behind the
--    existing owner-only RLS policy on the base table.
--
-- 2. Skills/asked_for only describe what someone DOES offer. Advisory,
--    consulting, and fractional-role work (e.g. "fractional CTO") often needs
--    the inverse too — what they explicitly are NOT taking on right now
--    ("full-time roles", "backend-only gigs") — so a visitor can tell fit
--    without messaging first. not_available_for is the public counterpart to
--    the private `constraints` column.

ALTER TABLE public.user_economic_profile
  ADD COLUMN not_available_for jsonb DEFAULT '[]'::jsonb NOT NULL;

-- Views run against the underlying table as the view's owner (the migration
-- role, which owns user_economic_profile and is therefore exempt from its
-- RLS policies, same as any table owner). Granting SELECT on the view to
-- anon/authenticated exposes exactly these columns to any visitor, while the
-- base table's owner-only policies keep constraints/motivation/stage private.
CREATE VIEW public.user_economic_profile_public AS
SELECT
  user_id,
  skills,
  assets,
  asked_for,
  not_available_for,
  updated_at
FROM public.user_economic_profile;

GRANT SELECT ON public.user_economic_profile_public TO anon;
GRANT SELECT ON public.user_economic_profile_public TO authenticated;
GRANT SELECT ON public.user_economic_profile_public TO service_role;
