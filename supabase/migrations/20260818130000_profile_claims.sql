-- Claimable profile drafts.
--
-- A member can draft a profile for someone who isn't on the platform yet (a
-- DJ friend, an artist, anyone) and hand them a link. The recipient reviews
-- the draft, signs up (or logs in), and claiming copies the draft into their
-- own `profiles` row.
--
-- `profiles.id` is a validated FK to `auth.users(id)` (see
-- 20260807010000_validate_profiles_id_fkey.sql) — there is no way to
-- pre-create a real profile row before the recipient has a real auth
-- account. This table is the holding area for that content until they do.
--
-- The row's own `id` doubles as the claim token: a bare UUID is 122 bits of
-- randomness, unguessable, and needs no extra column. `/claim/<id>` is the
-- link a member sends.

CREATE TABLE public.profile_claims (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    suggested_username text,
    draft jsonb NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    claimed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    claimed_at timestamp with time zone,
    expires_at timestamp with time zone NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '180 days'),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT profile_claims_status_check CHECK (status = ANY (ARRAY['pending'::text, 'claimed'::text, 'revoked'::text])),
    CONSTRAINT profile_claims_claimed_fields_check CHECK (
        (status = 'claimed' AND claimed_by IS NOT NULL AND claimed_at IS NOT NULL)
        OR (status <> 'claimed' AND claimed_by IS NULL AND claimed_at IS NULL)
    )
);

COMMENT ON TABLE public.profile_claims IS 'Pre-drafted profile content a member creates on someone else''s behalf; the recipient claims it via /claim/<id>, which copies the draft into their own profiles row.';
COMMENT ON COLUMN public.profile_claims.draft IS 'Shape: { name, bio, avatar_url?, banner_url?, website?, social_links? }. Mirrors the subset of public.profiles the claim writes on completion.';

CREATE INDEX idx_profile_claims_created_by ON public.profile_claims USING btree (created_by);
CREATE INDEX idx_profile_claims_claimed_by ON public.profile_claims USING btree (claimed_by) WHERE (claimed_by IS NOT NULL);

CREATE TRIGGER profile_claims_set_updated_at
    BEFORE UPDATE ON public.profile_claims
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.profile_claims ENABLE ROW LEVEL SECURITY;

-- Deliberately no anon/authenticated policies. The row's id is the claim's
-- only credential (like a password-reset link) — a policy such as
-- `USING (status = 'pending')` would let anyone list every pending draft
-- platform-wide via PostgREST, token or not (see the pre-existing, broader
-- "Token invitations are viewable" policy on group_invitations for exactly
-- that shape of leak). Every read/write here goes through server routes
-- using the service-role client, which look up a single row by the id the
-- caller supplied — RLS has nothing to add on top of that and every
-- permissive policy here is a way to make it worse.

GRANT ALL ON TABLE public.profile_claims TO service_role;
