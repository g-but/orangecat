-- Channel Waitlist table for early interest capture
CREATE TABLE IF NOT EXISTS channel_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  user_id uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
  source text NULL, -- e.g., 'channel_page'
  referrer text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE channel_waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert email into waitlist
CREATE POLICY "Public can join channel waitlist"
  ON channel_waitlist FOR INSERT
  WITH CHECK (true);

-- Optional: allow owner to view their own entry (by email if authed)
-- We intentionally do not add a SELECT policy globally to keep emails private.

