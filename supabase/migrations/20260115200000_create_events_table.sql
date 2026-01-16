-- =============================================
-- CREATE EVENTS TABLE (Re-creation)
-- In-person events, meetups, gatherings
-- Created: 2026-01-15 due to original migration failure
-- =============================================

-- Create events table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,

  -- Basic Information
  title text NOT NULL,
  description text,
  category text,
  event_type text DEFAULT 'meetup' CHECK (event_type IN ('meetup', 'conference', 'workshop', 'party', 'exhibition', 'festival', 'retreat', 'other')),
  tags text[] DEFAULT '{}',

  -- Date & Time
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  timezone text DEFAULT 'UTC',
  is_all_day boolean DEFAULT false,
  is_recurring boolean DEFAULT false,
  recurrence_pattern jsonb, -- For recurring events

  -- Location
  venue_name text,
  venue_address text,
  venue_city text,
  venue_country text,
  venue_postal_code text,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  is_online boolean DEFAULT false,
  online_url text, -- For virtual events
  asset_id uuid, -- Link to asset if venue is an asset (rented space)

  -- Capacity & Attendance
  max_attendees integer,
  current_attendees integer DEFAULT 0,
  requires_rsvp boolean DEFAULT true,
  rsvp_deadline timestamptz,

  -- Pricing & Funding (uses CURRENCY_CODES from src/config/currencies.ts)
  ticket_price_sats bigint,
  currency text DEFAULT 'SATS' CHECK (currency IN ('USD', 'EUR', 'CHF', 'BTC', 'SATS')),
  is_free boolean DEFAULT false,
  funding_goal_sats bigint, -- Optional funding goal for event costs
  bitcoin_address text,
  lightning_address text,

  -- Media
  images text[] DEFAULT '{}',
  thumbnail_url text,
  banner_url text,
  video_url text,

  -- Status
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'open', 'full', 'ongoing', 'completed', 'cancelled')),

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_organization_id ON events(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_asset_id ON events(asset_id);

-- Create event_attendees table for RSVP management
CREATE TABLE IF NOT EXISTS public.event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'registered' CHECK (status IN ('registered', 'waitlisted', 'cancelled', 'attended', 'no_show')),
  ticket_count integer DEFAULT 1 CHECK (ticket_count > 0),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  transaction_id uuid, -- Link to transaction if paid
  registered_at timestamptz DEFAULT now(),
  checked_in_at timestamptz,
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user_id ON event_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_status ON event_attendees(status);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
-- Drop existing policies first (in case of re-run)
DROP POLICY IF EXISTS "Public can read published events" ON events;
DROP POLICY IF EXISTS "Users can read their own events" ON events;
DROP POLICY IF EXISTS "Users can create events" ON events;
DROP POLICY IF EXISTS "Users can update their own events" ON events;
DROP POLICY IF EXISTS "Users can delete their own draft events" ON events;
DROP POLICY IF EXISTS "Organization admins can manage org events" ON events;

-- Public can read published events
CREATE POLICY "Public can read published events"
  ON events FOR SELECT
  USING (status IN ('published', 'open', 'full', 'ongoing', 'completed'));

-- Users can read their own events
CREATE POLICY "Users can read their own events"
  ON events FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create events
CREATE POLICY "Users can create events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own events
CREATE POLICY "Users can update their own events"
  ON events FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own draft events
CREATE POLICY "Users can delete their own draft events"
  ON events FOR DELETE
  USING (auth.uid() = user_id AND status = 'draft');

-- RLS Policies for event_attendees
DROP POLICY IF EXISTS "Users can read event attendees" ON event_attendees;
DROP POLICY IF EXISTS "Users can register for events" ON event_attendees;
DROP POLICY IF EXISTS "Users can update their own registration" ON event_attendees;
DROP POLICY IF EXISTS "Event organizers can manage attendees" ON event_attendees;

-- Users can read attendees of events they can see
CREATE POLICY "Users can read event attendees"
  ON event_attendees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_attendees.event_id
      AND (
        events.status IN ('published', 'open', 'full', 'ongoing', 'completed')
        OR events.user_id = auth.uid()
      )
    )
  );

-- Users can register for events
CREATE POLICY "Users can register for events"
  ON event_attendees FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own registration
CREATE POLICY "Users can update their own registration"
  ON event_attendees FOR UPDATE
  USING (auth.uid() = user_id);

-- Event organizers can manage all attendees
CREATE POLICY "Event organizers can manage attendees"
  ON event_attendees FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_attendees.event_id
      AND events.user_id = auth.uid()
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();
