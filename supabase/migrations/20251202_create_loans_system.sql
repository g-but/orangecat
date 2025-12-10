-- Migration: Loans System - Peer-to-Peer Lending & Refinancing
-- Created: 2025-12-02
-- Purpose: Enable users to list loans for refinancing and community lending
-- Priority: P0 - Core revenue feature for OrangeCat platform
-- Impact: User financial services, community lending, platform monetization

BEGIN;

-- ==================== LOAN CATEGORIES ====================

CREATE TABLE IF NOT EXISTS loan_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  icon text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Insert default loan categories
INSERT INTO loan_categories (name, description, icon) VALUES
  ('Personal Loan', 'General personal loans from banks or online lenders', 'user'),
  ('Credit Card', 'Credit card debt consolidation', 'credit-card'),
  ('Student Loan', 'Student loan refinancing', 'graduation-cap'),
  ('Auto Loan', 'Car loan refinancing', 'car'),
  ('Mortgage', 'Home mortgage refinancing', 'home'),
  ('Business Loan', 'Small business loan refinancing', 'building'),
  ('Payday Loan', 'High-interest payday loan refinancing', 'dollar-sign'),
  ('Medical Debt', 'Medical bill refinancing', 'heart'),
  ('Other', 'Other types of loans or debt', 'file-text')
ON CONFLICT (name) DO NOTHING;

-- ==================== LOANS TABLE ====================

CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Loan details
  title text NOT NULL CHECK (char_length(title) <= 200),
  description text CHECK (char_length(description) <= 2000),
  loan_category_id uuid REFERENCES loan_categories(id),

  -- Financial details
  original_amount numeric(15,8) NOT NULL CHECK (original_amount > 0),
  remaining_balance numeric(15,8) NOT NULL CHECK (remaining_balance >= 0),
  interest_rate numeric(5,2) CHECK (interest_rate >= 0 AND interest_rate <= 100),
  monthly_payment numeric(15,8),
  currency text DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'BTC', 'SATS')),

  -- Loan metadata
  lender_name text CHECK (char_length(lender_name) <= 100),
  loan_number text CHECK (char_length(loan_number) <= 100), -- Masked for privacy
  origination_date date,
  maturity_date date,

  -- Platform details
  status text DEFAULT 'active' CHECK (status IN ('active', 'paid_off', 'refinanced', 'defaulted', 'cancelled')),
  is_public boolean DEFAULT true,
  is_negotiable boolean DEFAULT true,
  minimum_offer_amount numeric(15,8),

  -- Refinancing preferences
  preferred_terms text CHECK (char_length(preferred_terms) <= 1000),
  contact_method text DEFAULT 'platform' CHECK (contact_method IN ('platform', 'email', 'phone')),

  -- Metadata
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  paid_off_at timestamptz,

  -- Constraints
  CHECK (remaining_balance <= original_amount),
  CHECK (maturity_date IS NULL OR maturity_date > origination_date),
  CHECK (minimum_offer_amount IS NULL OR minimum_offer_amount > 0)
);

-- Indexes for loans
CREATE INDEX idx_loans_user ON loans(user_id, created_at DESC);
CREATE INDEX idx_loans_status ON loans(status, created_at DESC);
CREATE INDEX idx_loans_category ON loans(loan_category_id);
CREATE INDEX idx_loans_public ON loans(is_public) WHERE is_public = true;
CREATE INDEX idx_loans_remaining_balance ON loans(remaining_balance DESC);

-- Updated_at trigger for loans
CREATE OR REPLACE FUNCTION update_loans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_loans_updated_at
  BEFORE UPDATE ON loans
  FOR EACH ROW EXECUTE FUNCTION update_loans_updated_at();

-- ==================== LOAN OFFERS TABLE ====================

CREATE TABLE IF NOT EXISTS loan_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  offerer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Offer details
  offer_type text NOT NULL CHECK (offer_type IN ('refinance', 'payoff')),
  offer_amount numeric(15,8) NOT NULL CHECK (offer_amount > 0),
  interest_rate numeric(5,2) CHECK (interest_rate >= 0 AND interest_rate <= 100),
  term_months integer CHECK (term_months > 0 AND term_months <= 360),
  monthly_payment numeric(15,8),

  -- Terms and conditions
  terms text CHECK (char_length(terms) <= 2000),
  conditions text CHECK (char_length(conditions) <= 1000),

  -- Status and negotiation
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'cancelled')),
  is_binding boolean DEFAULT false,
  expires_at timestamptz DEFAULT (now() + interval '30 days'),

  -- Metadata
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  accepted_at timestamptz,
  rejected_at timestamptz,

  -- Constraints
  UNIQUE(loan_id, offerer_id, status) DEFERRABLE INITIALLY DEFERRED, -- Allow multiple offers but not duplicate status
  CHECK (offer_type = 'payoff' OR (interest_rate IS NOT NULL AND term_months IS NOT NULL)),
  CHECK (expires_at > created_at)
);

-- Indexes for loan offers
CREATE INDEX idx_loan_offers_loan ON loan_offers(loan_id, created_at DESC);
CREATE INDEX idx_loan_offers_offerer ON loan_offers(offerer_id, created_at DESC);
CREATE INDEX idx_loan_offers_status ON loan_offers(status, created_at DESC);
CREATE INDEX idx_loan_offers_expires ON loan_offers(expires_at) WHERE status = 'pending';

-- Updated_at trigger for loan offers
CREATE OR REPLACE FUNCTION update_loan_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_loan_offers_updated_at
  BEFORE UPDATE ON loan_offers
  FOR EACH ROW EXECUTE FUNCTION update_loan_offers_updated_at();

-- ==================== LOAN PAYMENTS TABLE ====================

CREATE TABLE IF NOT EXISTS loan_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  offer_id uuid REFERENCES loan_offers(id) ON DELETE SET NULL, -- May be null for original payments

  -- Payment details
  amount numeric(15,8) NOT NULL CHECK (amount > 0),
  currency text DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'BTC', 'SATS')),
  payment_type text NOT NULL CHECK (payment_type IN ('monthly', 'lump_sum', 'refinance', 'payoff')),

  -- Parties involved
  payer_id uuid NOT NULL REFERENCES profiles(id), -- Who made the payment
  recipient_id uuid NOT NULL REFERENCES profiles(id), -- Who received the payment

  -- Transaction details
  transaction_id text, -- External payment processor ID
  payment_method text CHECK (payment_method IN ('bitcoin', 'lightning', 'bank_transfer', 'card', 'other')),
  notes text CHECK (char_length(notes) <= 500),

  -- Status
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  processed_at timestamptz DEFAULT now(),

  -- Metadata
  created_at timestamptz DEFAULT now() NOT NULL,

  -- Constraints
  CHECK (payer_id != recipient_id)
);

-- Indexes for loan payments
CREATE INDEX idx_loan_payments_loan ON loan_payments(loan_id, created_at DESC);
CREATE INDEX idx_loan_payments_offer ON loan_payments(offer_id) WHERE offer_id IS NOT NULL;
CREATE INDEX idx_loan_payments_payer ON loan_payments(payer_id, created_at DESC);
CREATE INDEX idx_loan_payments_recipient ON loan_payments(recipient_id, created_at DESC);
CREATE INDEX idx_loan_payments_status ON loan_payments(status, processed_at DESC);

-- ==================== LOAN STATS VIEW ====================

CREATE OR REPLACE VIEW loan_stats AS
SELECT
  l.id as loan_id,
  l.user_id as loan_owner_id,
  l.remaining_balance,
  l.interest_rate,
  l.status,

  -- Offer statistics
  COALESCE(offer_counts.total_offers, 0) as total_offers,
  COALESCE(offer_counts.pending_offers, 0) as pending_offers,
  COALESCE(offer_counts.accepted_offers, 0) as accepted_offers,

  -- Best offers
  best_offer.best_offer_amount,
  best_offer.best_interest_rate,
  best_offer.best_term_months,

  -- Payment statistics
  COALESCE(payment_stats.total_paid, 0) as total_paid,
  COALESCE(payment_stats.last_payment_date, NULL) as last_payment_date

FROM loans l
LEFT JOIN (
  SELECT
    loan_id,
    COUNT(*) as total_offers,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_offers,
    COUNT(*) FILTER (WHERE status = 'accepted') as accepted_offers
  FROM loan_offers
  GROUP BY loan_id
) offer_counts ON l.id = offer_counts.loan_id
LEFT JOIN (
  SELECT
    loan_id,
    MAX(offer_amount) as best_offer_amount,
    MIN(interest_rate) as best_interest_rate,
    MAX(term_months) as best_term_months
  FROM loan_offers
  WHERE status = 'pending'
  GROUP BY loan_id
) best_offer ON l.id = best_offer.loan_id
LEFT JOIN (
  SELECT
    loan_id,
    SUM(amount) as total_paid,
    MAX(processed_at) as last_payment_date
  FROM loan_payments
  WHERE status = 'completed'
  GROUP BY loan_id
) payment_stats ON l.id = payment_stats.loan_id;

-- ==================== HELPER FUNCTIONS ====================

-- Get loans for a user
CREATE OR REPLACE FUNCTION get_user_loans(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  remaining_balance numeric,
  interest_rate numeric,
  status text,
  total_offers bigint,
  pending_offers bigint,
  last_payment_date timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    l.id,
    l.title,
    l.remaining_balance,
    l.interest_rate,
    l.status,
    COALESCE(ls.total_offers, 0) as total_offers,
    COALESCE(ls.pending_offers, 0) as pending_offers,
    ls.last_payment_date
  FROM loans l
  LEFT JOIN loan_stats ls ON l.id = ls.loan_id
  WHERE l.user_id = p_user_id
  ORDER BY l.created_at DESC;
$$;

-- Get available loans for offering (public loans from other users)
CREATE OR REPLACE FUNCTION get_available_loans(p_user_id uuid DEFAULT NULL, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  remaining_balance numeric,
  interest_rate numeric,
  monthly_payment numeric,
  lender_name text,
  total_offers bigint,
  best_offer_amount numeric,
  best_interest_rate numeric,
  owner_username text,
  owner_display_name text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    l.id,
    l.title,
    l.description,
    l.remaining_balance,
    l.interest_rate,
    l.monthly_payment,
    l.lender_name,
    COALESCE(ls.total_offers, 0) as total_offers,
    ls.best_offer_amount,
    ls.best_interest_rate,
    p.username as owner_username,
    p.full_name as owner_display_name,
    l.created_at
  FROM loans l
  JOIN profiles p ON l.user_id = p.id
  LEFT JOIN loan_stats ls ON l.id = ls.loan_id
  WHERE l.is_public = true
    AND l.status = 'active'
    AND (p_user_id IS NULL OR l.user_id != p_user_id)
  ORDER BY l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- Create a loan offer
CREATE OR REPLACE FUNCTION create_loan_offer(
  p_loan_id uuid,
  p_offerer_id uuid,
  p_offer_type text,
  p_offer_amount numeric,
  p_interest_rate numeric DEFAULT NULL,
  p_term_months integer DEFAULT NULL,
  p_terms text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer_id uuid;
  v_loan_owner uuid;
BEGIN
  -- Get loan owner
  SELECT user_id INTO v_loan_owner
  FROM loans
  WHERE id = p_loan_id AND status = 'active';

  IF v_loan_owner IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Loan not found or not active');
  END IF;

  IF v_loan_owner = p_offerer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot offer on your own loan');
  END IF;

  -- Check minimum offer amount if specified
  IF EXISTS (
    SELECT 1 FROM loans
    WHERE id = p_loan_id
      AND minimum_offer_amount IS NOT NULL
      AND p_offer_amount < minimum_offer_amount
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Offer amount below minimum required');
  END IF;

  -- Insert offer
  INSERT INTO loan_offers (
    loan_id, offerer_id, offer_type, offer_amount,
    interest_rate, term_months, terms
  ) VALUES (
    p_loan_id, p_offerer_id, p_offer_type, p_offer_amount,
    p_interest_rate, p_term_months, p_terms
  )
  RETURNING id INTO v_offer_id;

  RETURN jsonb_build_object(
    'success', true,
    'offer_id', v_offer_id,
    'message', 'Offer submitted successfully'
  );
END;
$$;

-- ==================== RLS POLICIES ====================

-- Loan categories - readable by all
ALTER TABLE loan_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Loan categories are viewable by everyone"
  ON loan_categories FOR SELECT
  USING (true);

-- Loans RLS
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own loans"
  ON loans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public loans from others"
  ON loans FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can create their own loans"
  ON loans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loans"
  ON loans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own loans"
  ON loans FOR DELETE
  USING (auth.uid() = user_id);

-- Loan offers RLS
ALTER TABLE loan_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Loan owners and offerers can view offers"
  ON loan_offers FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM loans WHERE id = loan_id
      UNION
      SELECT offerer_id FROM loan_offers WHERE id = loan_offers.id
    )
  );

CREATE POLICY "Users can create offers on public loans"
  ON loan_offers FOR INSERT
  WITH CHECK (
    auth.uid() = offerer_id
    AND EXISTS (
      SELECT 1 FROM loans
      WHERE id = loan_id
        AND is_public = true
        AND status = 'active'
        AND user_id != auth.uid()
    )
  );

CREATE POLICY "Offerers can update their own offers"
  ON loan_offers FOR UPDATE
  USING (auth.uid() = offerer_id)
  WITH CHECK (auth.uid() = offerer_id);

CREATE POLICY "Loan owners can update offer status"
  ON loan_offers FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM loans WHERE id = loan_id
    )
  );

-- Loan payments RLS
ALTER TABLE loan_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payment parties can view payments"
  ON loan_payments FOR SELECT
  USING (auth.uid() IN (payer_id, recipient_id));

CREATE POLICY "Users can create payments they are involved in"
  ON loan_payments FOR INSERT
  WITH CHECK (auth.uid() IN (payer_id, recipient_id));

-- ==================== VERIFICATION ====================

DO $$
DECLARE
  v_categories_count integer;
  v_loans_table boolean;
  v_offers_table boolean;
  v_payments_table boolean;
  v_stats_view boolean;
  v_functions_exist boolean;
BEGIN
  -- Check tables exist
  SELECT COUNT(*) INTO v_categories_count FROM loan_categories;
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'loans') INTO v_loans_table;
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'loan_offers') INTO v_offers_table;
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'loan_payments') INTO v_payments_table;
  SELECT EXISTS (SELECT FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'loan_stats') INTO v_stats_view;

  -- Check key functions exist
  SELECT EXISTS (SELECT FROM pg_proc WHERE proname IN ('get_user_loans', 'get_available_loans', 'create_loan_offer')) INTO v_functions_exist;

  IF v_categories_count >= 9 AND v_loans_table AND v_offers_table AND v_payments_table AND v_stats_view AND v_functions_exist THEN
    RAISE NOTICE 'SUCCESS: Loans system created successfully';
    RAISE NOTICE '  ✓ Tables: loans, loan_offers, loan_payments, loan_categories';
    RAISE NOTICE '  ✓ View: loan_stats (with offer and payment analytics)';
    RAISE NOTICE '  ✓ Functions: get_user_loans, get_available_loans, create_loan_offer';
    RAISE NOTICE '  ✓ Categories: % loan categories created', v_categories_count;
    RAISE NOTICE '  ✓ RLS: Policies enabled for all tables';
    RAISE NOTICE '  ✓ P2P Lending: Ready for refinancing and community lending';
  ELSE
    RAISE EXCEPTION 'FAILED: Loans system incomplete - tables: %, %, %, %, view: %, functions: %',
      v_loans_table, v_offers_table, v_payments_table, v_stats_view, v_functions_exist, v_categories_count;
  END IF;
END $$;

-- ==================== COMMENTS ====================

COMMENT ON TABLE loans IS 'User loans available for refinancing or payoff offers';
COMMENT ON TABLE loan_offers IS 'Offers from users to refinance or pay off other users loans';
COMMENT ON TABLE loan_payments IS 'Payment transactions between users for loans';
COMMENT ON TABLE loan_categories IS 'Categories for different types of loans';
COMMENT ON VIEW loan_stats IS 'Aggregated statistics for loans including offers and payments';

COMMENT ON FUNCTION get_user_loans IS 'Get all loans for a specific user with statistics';
COMMENT ON FUNCTION get_available_loans IS 'Get public loans available for offers from other users';
COMMENT ON FUNCTION create_loan_offer IS 'Create a new offer to refinance or pay off a loan';

COMMIT;

-- ==================== USAGE EXAMPLES ====================
--
-- 1. Create a loan:
--    INSERT INTO loans (user_id, title, original_amount, remaining_balance, interest_rate)
--    VALUES ('user-uuid', 'My Credit Card Debt', 5000.00, 3500.00, 24.99);
--
-- 2. Get available loans for offering:
--    SELECT * FROM get_available_loans('current-user-uuid', 10, 0);
--
-- 3. Create an offer:
--    SELECT create_loan_offer('loan-uuid', 'offerer-uuid', 'refinance', 3500.00, 12.99, 36);
--
-- 4. Get user's loans with stats:
--    SELECT * FROM get_user_loans('user-uuid');

















