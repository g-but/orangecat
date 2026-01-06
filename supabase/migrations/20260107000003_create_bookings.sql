-- Booking System
-- Unified bookings for services and asset rentals

-- Bookings table (polymorphic: works for services and assets)
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What is being booked (polymorphic reference)
  bookable_type TEXT NOT NULL CHECK (bookable_type IN ('service', 'asset')),
  bookable_id UUID NOT NULL,

  -- Who is involved
  provider_actor_id UUID NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
  customer_actor_id UUID NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
  customer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Timing
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  duration_minutes INT,

  -- Pricing
  price_sats BIGINT NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'SATS',
  deposit_sats BIGINT DEFAULT 0,
  deposit_paid BOOLEAN DEFAULT false,
  total_paid_sats BIGINT DEFAULT 0,

  -- Status workflow: pending -> confirmed -> in_progress -> completed
  -- Or: pending -> cancelled / rejected
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Awaiting provider approval
    'confirmed',    -- Provider approved, awaiting start time
    'in_progress',  -- Currently active
    'completed',    -- Successfully finished
    'cancelled',    -- Cancelled by customer
    'rejected',     -- Rejected by provider
    'no_show'       -- Customer didn't show up
  )),

  -- Additional details
  customer_notes TEXT,
  provider_notes TEXT,
  cancellation_reason TEXT,
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Availability slots for services
CREATE TABLE IF NOT EXISTS availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What this slot is for
  service_id UUID NOT NULL REFERENCES user_services(id) ON DELETE CASCADE,
  provider_actor_id UUID NOT NULL REFERENCES actors(id) ON DELETE CASCADE,

  -- Recurring schedule (day_of_week) or specific date
  day_of_week INT CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  specific_date DATE, -- For one-off availability

  -- Time window
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Whether this slot is available
  is_available BOOLEAN DEFAULT true,

  -- Slot capacity (for group sessions)
  max_bookings INT DEFAULT 1,
  current_bookings INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Must have either day_of_week OR specific_date
  CONSTRAINT slot_has_schedule CHECK (
    (day_of_week IS NOT NULL AND specific_date IS NULL) OR
    (day_of_week IS NULL AND specific_date IS NOT NULL)
  )
);

-- Asset availability (for rentals)
CREATE TABLE IF NOT EXISTS asset_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  asset_id UUID NOT NULL REFERENCES user_assets(id) ON DELETE CASCADE,
  provider_actor_id UUID NOT NULL REFERENCES actors(id) ON DELETE CASCADE,

  -- Availability period
  available_from DATE NOT NULL,
  available_to DATE,  -- NULL means indefinitely available

  -- Rental terms
  min_rental_hours INT DEFAULT 1,
  max_rental_hours INT,
  rental_price_per_hour BIGINT,
  rental_price_per_day BIGINT,

  -- Blocked periods (JSON array of date ranges)
  blocked_dates JSONB DEFAULT '[]',

  is_available BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_bookable ON bookings(bookable_type, bookable_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider ON bookings(provider_actor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_actor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_user ON bookings(customer_user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_starts_at ON bookings(starts_at);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_availability_slots_service ON availability_slots(service_id);
CREATE INDEX IF NOT EXISTS idx_availability_slots_provider ON availability_slots(provider_actor_id);
CREATE INDEX IF NOT EXISTS idx_availability_slots_day ON availability_slots(day_of_week);
CREATE INDEX IF NOT EXISTS idx_availability_slots_date ON availability_slots(specific_date);

CREATE INDEX IF NOT EXISTS idx_asset_availability_asset ON asset_availability(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_availability_provider ON asset_availability(provider_actor_id);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bookings

-- Providers can see their bookings
CREATE POLICY "Providers can view their bookings"
  ON bookings
  FOR SELECT
  USING (provider_actor_id IN (
    SELECT id FROM actors WHERE user_id = auth.uid()
  ));

-- Customers can see their bookings
CREATE POLICY "Customers can view their bookings"
  ON bookings
  FOR SELECT
  USING (customer_user_id = auth.uid());

-- Customers can create bookings
CREATE POLICY "Customers can create bookings"
  ON bookings
  FOR INSERT
  WITH CHECK (customer_user_id = auth.uid());

-- Customers can update their pending bookings (cancel)
CREATE POLICY "Customers can update their bookings"
  ON bookings
  FOR UPDATE
  USING (customer_user_id = auth.uid() AND status IN ('pending', 'confirmed'))
  WITH CHECK (customer_user_id = auth.uid());

-- Providers can update bookings they provide
CREATE POLICY "Providers can update bookings"
  ON bookings
  FOR UPDATE
  USING (provider_actor_id IN (
    SELECT id FROM actors WHERE user_id = auth.uid()
  ));

-- RLS Policies for availability_slots

-- Anyone can view available slots (for booking UI)
CREATE POLICY "Anyone can view available slots"
  ON availability_slots
  FOR SELECT
  USING (is_available = true);

-- Providers can manage their slots
CREATE POLICY "Providers can manage their slots"
  ON availability_slots
  FOR ALL
  USING (provider_actor_id IN (
    SELECT id FROM actors WHERE user_id = auth.uid()
  ));

-- RLS Policies for asset_availability

-- Anyone can view asset availability
CREATE POLICY "Anyone can view asset availability"
  ON asset_availability
  FOR SELECT
  USING (is_available = true);

-- Providers can manage their asset availability
CREATE POLICY "Providers can manage asset availability"
  ON asset_availability
  FOR ALL
  USING (provider_actor_id IN (
    SELECT id FROM actors WHERE user_id = auth.uid()
  ));

-- Function to check slot conflicts
CREATE OR REPLACE FUNCTION check_booking_conflict(
  p_bookable_type TEXT,
  p_bookable_id UUID,
  p_starts_at TIMESTAMPTZ,
  p_ends_at TIMESTAMPTZ,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM bookings
    WHERE bookable_type = p_bookable_type
    AND bookable_id = p_bookable_id
    AND status IN ('confirmed', 'in_progress')
    AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
    AND (
      (starts_at <= p_starts_at AND ends_at > p_starts_at) OR
      (starts_at < p_ends_at AND ends_at >= p_ends_at) OR
      (starts_at >= p_starts_at AND ends_at <= p_ends_at)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_booking_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_bookings_updated_at ON bookings;
CREATE TRIGGER trigger_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_timestamp();

DROP TRIGGER IF EXISTS trigger_availability_slots_updated_at ON availability_slots;
CREATE TRIGGER trigger_availability_slots_updated_at
  BEFORE UPDATE ON availability_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_timestamp();

DROP TRIGGER IF EXISTS trigger_asset_availability_updated_at ON asset_availability;
CREATE TRIGGER trigger_asset_availability_updated_at
  BEFORE UPDATE ON asset_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_timestamp();
