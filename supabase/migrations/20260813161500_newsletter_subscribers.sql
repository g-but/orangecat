-- Newsletter subscribers — capture only (no sending pipeline yet).
--
-- WHY: the /blog "Stay Updated" box was a bare input with no handler; every
-- email typed into it went nowhere. This table is the capture side of the
-- distribution engine — sending comes later and needs nothing more than this
-- list.
--
-- Access model: an email list is PII. RLS is ENABLED with NO policies, so the
-- anon and authenticated roles can neither read nor write it; the ONLY path
-- in is POST /api/newsletter/subscribe using the service-role client (which
-- bypasses RLS), after validation + rate limiting.

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    -- Stored lowercased by the API so the UNIQUE constraint is effectively
    -- case-insensitive (email local-parts are case-insensitive in practice).
    email text NOT NULL UNIQUE,
    -- Which surface captured the signup ('blog', ...) — attribution once
    -- there is more than one capture point.
    source text DEFAULT 'blog' NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,

    CONSTRAINT newsletter_subscribers_email_length CHECK (char_length(email) BETWEEN 3 AND 200),
    CONSTRAINT newsletter_subscribers_source_length CHECK (char_length(source) BETWEEN 1 AND 50)
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.newsletter_subscribers IS
  'Newsletter capture list. Service-role writes only — RLS enabled with no policies by design.';
