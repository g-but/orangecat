-- Create causes table
CREATE TABLE public.causes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    cause_category text,
    target_amount numeric,
    current_amount numeric DEFAULT 0,
    currency text DEFAULT 'SATS' CHECK (currency IN ('SATS', 'BTC', 'CHF', 'EUR', 'USD', 'GBP')),
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    is_public boolean DEFAULT true,
    contact_method text DEFAULT 'platform' CHECK (contact_method IN ('platform', 'email', 'phone')),
    bitcoin_address text,
    lightning_address text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    actor_id uuid
);

-- Create indexes
CREATE INDEX idx_causes_user_id ON public.causes(user_id);
CREATE INDEX idx_causes_status ON public.causes(status);
CREATE INDEX idx_causes_public ON public.causes(is_public) WHERE is_public = true;

-- Enable RLS
ALTER TABLE public.causes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view public causes" ON public.causes
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own causes" ON public.causes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own causes" ON public.causes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own causes" ON public.causes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own causes" ON public.causes
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_causes_updated_at BEFORE UPDATE ON public.causes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.causes IS 'Charitable fundraising campaigns and causes';
COMMENT ON COLUMN public.causes.target_amount IS 'Target amount to raise for the cause';
COMMENT ON COLUMN public.causes.current_amount IS 'Current amount raised so far';
