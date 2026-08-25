-- `profiles.location_context` is read as a privacy control and has never existed.
--
-- profileSchema accepts it (`optionalText(300)`), the profile editor writes it
-- (src/components/profile/hooks/useProfileEditor.ts), ProfileLocationSection
-- stores canton/region text in it, and — the part that matters —
-- ProfileDetailsCard gates the whole location block on
-- `isLocationHidden(profile.location_context)`.
--
-- There is no such column. Verified 2026-08-25 against production:
-- information_schema lists 48 columns on public.profiles and this is not one of
-- them, and `?select=location_context&limit=0` returns 42703 while a control
-- column returns 200.
--
-- The consequence is a privacy setting that cannot persist, and it fails OPEN:
-- parseLocationContext('') returns mode 'actual', so a user who chooses "hide my
-- location" gets location_context dropped on write and reads back as visible on
-- the next load. A control that silently reverts to the permissive state is
-- worse than one that never existed, because the user believes they set it.
--
-- TEXT, nullable, no default: the parser treats empty and NULL identically
-- (mode 'actual'), so existing rows keep exactly today's behaviour and only
-- users who actively choose a mode get a stored value.
--
-- Not folded into privacy_settings/metadata JSONB on purpose — every reader in
-- src/ already reads a flat `profile.location_context`, and moving the storage
-- shape would mean changing all of them to fix a missing column.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS location_context text;

COMMENT ON COLUMN public.profiles.location_context IS
  'Location display mode + free context, parsed by src/lib/location-privacy.ts. Holds the __HIDE__ token (hide location entirely) or a group: prefix (show a region label instead of the exact place). Empty/NULL means show the actual location.';
