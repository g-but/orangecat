-- Let a handle change without breaking what already points at it.
--
-- 77 accounts still publish their email local part as a username
-- (20260826130000 stopped minting new ones; it deliberately renamed nobody).
-- Renaming them is the fix, but a username here is not just a display name:
--
--   * it is a public profile URL   /profiles/<username>
--   * it is a LIGHTNING ADDRESS    <username>@orangecat.ch
--     (.well-known/lnurlp, /api/lnurlp/<username>/callback)
--
-- So a bare rename would silently break saved payment addresses and every
-- inbound link — for real people, with no error anyone would see until a
-- payment failed. This table is what makes renaming safe: the old handle keeps
-- resolving forever, so a rename changes what a profile is CALLED without
-- changing what can still find it.
--
-- Kept forever, not expired: a Lightning address someone saved in 2025 has no
-- expiry either, and a dangling payment identifier is worse than a stale row.

CREATE TABLE IF NOT EXISTS public.profile_username_history (
  -- The handle as it used to be. Primary key: one old handle can only ever
  -- have belonged to one account, and re-issuing it to somebody else would
  -- silently redirect the first person's payments to the second.
  -- Stored lowercase, enforced. PostgREST can only filter on COLUMNS, not on
  -- expressions, so a `lower(old_username)` index would be unusable from the
  -- app and the lookup would fall back to `ilike` — which treats `_` as a
  -- wildcard, and `_` is legal in a username. With every new handle shaped
  -- `user_<hex>`, an ilike lookup for `user_823e4d9d2714` also matches
  -- `userX823e4d9d2714`. On a lookup that decides where money goes, the
  -- matcher has to be exact, so the column holds the canonical form.
  old_username text PRIMARY KEY CHECK (old_username = lower(old_username)),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  changed_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profile_username_history IS
  'Handles a profile used to have. Old profile URLs 301 here and Lightning addresses still resolve through it, so renaming an account breaks nothing that already points at it.';

CREATE INDEX IF NOT EXISTS profile_username_history_profile_id_idx
  ON public.profile_username_history (profile_id);

ALTER TABLE public.profile_username_history ENABLE ROW LEVEL SECURITY;

-- Readable by anyone, like the profiles it points at: resolving an old handle
-- is exactly as public as resolving the current one, and both the profile page
-- and the LNURL endpoint are unauthenticated. It holds no more than a mapping
-- between two public handles.
CREATE POLICY "username history is public"
  ON public.profile_username_history FOR SELECT
  USING (true);

-- Writes only through the rename path (service_role). A user who could insert
-- here could claim someone else's old handle and capture their payments.
CREATE POLICY "username history is service-write only"
  ON public.profile_username_history FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);
