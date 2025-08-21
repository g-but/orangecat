-- Add missing fields to funding_pages table
-- This migration safely adds only the missing columns

-- Add missing columns if they don't exist
ALTER TABLE public.funding_pages 
ADD COLUMN IF NOT EXISTS lightning_address text,
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS slug text,
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS tags text[],
ADD COLUMN IF NOT EXISTS featured_image_url text,
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS end_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'SATS';

-- Make bitcoin_address optional if it's currently required
DO $$ 
BEGIN
    -- Check if bitcoin_address is NOT NULL and make it nullable
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'funding_pages' 
        AND column_name = 'bitcoin_address' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.funding_pages ALTER COLUMN bitcoin_address DROP NOT NULL;
    END IF;
END $$;

-- Add constraints safely
DO $$
BEGIN
    -- Add slug unique constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'funding_pages_slug_unique'
    ) THEN
        ALTER TABLE public.funding_pages 
        ADD CONSTRAINT funding_pages_slug_unique UNIQUE (slug);
    END IF;

    -- Add currency check constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'funding_pages_valid_currency'
    ) THEN
        ALTER TABLE public.funding_pages 
        ADD CONSTRAINT funding_pages_valid_currency CHECK (currency IN ('BTC', 'SATS'));
    END IF;

    -- Add category check constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'funding_pages_valid_category'
    ) THEN
        ALTER TABLE public.funding_pages 
        ADD CONSTRAINT funding_pages_valid_category CHECK (
            category IS NULL OR category IN (
                'creative', 'technology', 'community', 'education', 
                'charity', 'business', 'personal', 'other'
            )
        );
    END IF;

    -- Add payment method constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'funding_pages_payment_method_required'
    ) THEN
        ALTER TABLE public.funding_pages 
        ADD CONSTRAINT funding_pages_payment_method_required CHECK (
            bitcoin_address IS NOT NULL OR lightning_address IS NOT NULL
        );
    END IF;
END $$;

-- Create indexes safely
CREATE INDEX IF NOT EXISTS idx_funding_pages_user_id ON public.funding_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_funding_pages_slug ON public.funding_pages(slug);
CREATE INDEX IF NOT EXISTS idx_funding_pages_category ON public.funding_pages(category);
CREATE INDEX IF NOT EXISTS idx_funding_pages_is_public ON public.funding_pages(is_public);
CREATE INDEX IF NOT EXISTS idx_funding_pages_is_active ON public.funding_pages(is_active);
CREATE INDEX IF NOT EXISTS idx_funding_pages_created_at ON public.funding_pages(created_at DESC);

-- Function to generate unique slug (replace if exists)
CREATE OR REPLACE FUNCTION generate_funding_page_slug(title_text text, user_id_param uuid)
RETURNS text AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Create base slug from title
  base_slug := lower(regexp_replace(trim(title_text), '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := trim(base_slug, '-');
  
  -- Ensure slug is not empty
  IF base_slug = '' THEN
    base_slug := 'fundraising-page';
  END IF;
  
  -- Check if slug exists and increment if needed
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.funding_pages WHERE slug = final_slug AND user_id != user_id_param) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate slug on insert/update (replace if exists)
CREATE OR REPLACE FUNCTION set_funding_page_slug()
RETURNS trigger AS $$
BEGIN
  -- Only generate slug if it's not provided or if title changed
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND OLD.title != NEW.title AND NEW.slug = OLD.slug) THEN
    NEW.slug := generate_funding_page_slug(NEW.title, NEW.user_id);
  END IF;
  
  -- Update the updated_at timestamp
  NEW.updated_at := timezone('utc'::text, now());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating slugs (replace if exists)
DROP TRIGGER IF EXISTS set_funding_page_slug_trigger ON public.funding_pages;
CREATE TRIGGER set_funding_page_slug_trigger
  BEFORE INSERT OR UPDATE ON public.funding_pages
  FOR EACH ROW EXECUTE FUNCTION set_funding_page_slug();

-- Add helpful comments
COMMENT ON TABLE public.funding_pages IS 'Fundraising pages created by users to accept Bitcoin donations';
COMMENT ON COLUMN public.funding_pages.slug IS 'URL-friendly identifier for the fundraising page';
COMMENT ON COLUMN public.funding_pages.category IS 'Category of the fundraising campaign';
COMMENT ON COLUMN public.funding_pages.tags IS 'Array of tags for better discoverability';
COMMENT ON COLUMN public.funding_pages.website_url IS 'Optional website URL for more information';
COMMENT ON COLUMN public.funding_pages.lightning_address IS 'Lightning Network address for instant payments';
COMMENT ON COLUMN public.funding_pages.currency IS 'Currency unit for goal_amount (BTC or SATS)'; 