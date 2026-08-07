-- Platform feedback + public "Ask Cat" channel.
--
-- WHY: the only feedback path on the site was an external, env-gated widget,
-- and a visitor (no account) had no way to ask Cat anything. This table backs
-- /feedback: anyone can leave feedback or a question, Cat answers immediately,
-- and the stored exchange becomes grounding context for future answers — the
-- learning loop the Cat was missing on customer interactions.
--
-- Access model: anonymous visitors have no auth.uid(), so ALL access goes
-- through the API route using the service-role client. RLS is enabled with a
-- read policy for authenticated users on their own rows only (so a signed-in
-- submitter can later see their history); no anon grants at all — the anon
-- role cannot touch the table directly.

CREATE TABLE IF NOT EXISTS public.platform_feedback (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    -- Null for anonymous visitors. No FK to auth.users: feedback is a customer
    -- record the platform learns from, and it must survive account deletion.
    user_id uuid,
    -- Optional contact for follow-up; never required.
    email text,
    -- Where on the site the submitter was (helps reproduce UX complaints).
    page_path text,
    message text NOT NULL,
    -- 'question' | 'feedback' — classified by Cat when it answers.
    kind text DEFAULT 'feedback' NOT NULL,
    -- Cat's immediate reply; null when the platform LLM was unavailable.
    cat_answer text,
    answered_at timestamptz,
    -- new → answered (Cat replied) → resolved (a human reviewed/acted).
    -- resolution_note is the human correction Cat grounds future answers on.
    status text DEFAULT 'new' NOT NULL,
    resolution_note text,
    created_at timestamptz DEFAULT now() NOT NULL,

    CONSTRAINT platform_feedback_kind_check CHECK (kind IN ('question', 'feedback')),
    CONSTRAINT platform_feedback_status_check CHECK (status IN ('new', 'answered', 'resolved')),
    CONSTRAINT platform_feedback_message_length CHECK (char_length(message) BETWEEN 1 AND 4000)
);

CREATE INDEX IF NOT EXISTS platform_feedback_created_idx
    ON public.platform_feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS platform_feedback_status_idx
    ON public.platform_feedback (status);

ALTER TABLE public.platform_feedback ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'platform_feedback'
      AND policyname = 'Users can view own feedback'
  ) THEN
    CREATE POLICY "Users can view own feedback" ON public.platform_feedback
      FOR SELECT USING (user_id = (SELECT auth.uid()));
  END IF;
END $$;

GRANT SELECT ON public.platform_feedback TO authenticated;
GRANT ALL ON public.platform_feedback TO service_role;
