-- Ensure funding_pages table has all required columns
-- This migration ensures compatibility with the current codebase

-- Create the table if it doesn't exist (with all current fields)
CREATE TABLE IF NOT EXISTS public.funding_pages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  goal_amount decimal,
  current_amount decimal DEFAULT 0,
  status text DEFAULT 'active',
  bitcoin_address text,
  lightning_address text,
  website_url text,
  slug text,
  category text,
  tags text[],
  featured_image_url text,
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  is_public boolean DEFAULT true,
  total_funding decimal DEFAULT 0,
  contributor_count integer DEFAULT 0,
  currency text DEFAULT 'BTC',
  end_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add columns that might be missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funding_pages' AND column_name = 'bitcoin_address') THEN
    ALTER TABLE public.funding_pages ADD COLUMN bitcoin_address text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funding_pages' AND column_name = 'lightning_address') THEN
    ALTER TABLE public.funding_pages ADD COLUMN lightning_address text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funding_pages' AND column_name = 'website_url') THEN
    ALTER TABLE public.funding_pages ADD COLUMN website_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funding_pages' AND column_name = 'slug') THEN
    ALTER TABLE public.funding_pages ADD COLUMN slug text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funding_pages' AND column_name = 'category') THEN
    ALTER TABLE public.funding_pages ADD COLUMN category text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funding_pages' AND column_name = 'tags') THEN
    ALTER TABLE public.funding_pages ADD COLUMN tags text[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funding_pages' AND column_name = 'is_active') THEN
    ALTER TABLE public.funding_pages ADD COLUMN is_active boolean DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funding_pages' AND column_name = 'is_public') THEN
    ALTER TABLE public.funding_pages ADD COLUMN is_public boolean DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funding_pages' AND column_name = 'total_funding') THEN
    ALTER TABLE public.funding_pages ADD COLUMN total_funding decimal DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funding_pages' AND column_name = 'contributor_count') THEN
    ALTER TABLE public.funding_pages ADD COLUMN contributor_count integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funding_pages' AND column_name = 'currency') THEN
    ALTER TABLE public.funding_pages ADD COLUMN currency text DEFAULT 'BTC';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funding_pages' AND column_name = 'featured_image_url') THEN
    ALTER TABLE public.funding_pages ADD COLUMN featured_image_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funding_pages' AND column_name = 'is_featured') THEN
    ALTER TABLE public.funding_pages ADD COLUMN is_featured boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funding_pages' AND column_name = 'end_date') THEN
    ALTER TABLE public.funding_pages ADD COLUMN end_date timestamp with time zone;
  END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE public.funding_pages ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$
BEGIN
  -- Check and create select policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'funding_pages' 
    AND policyname = 'Funding pages are viewable by everyone'
  ) THEN
    CREATE POLICY "Funding pages are viewable by everyone"
      ON public.funding_pages FOR SELECT
      USING (true);
  END IF;

  -- Check and create insert policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'funding_pages' 
    AND policyname = 'Users can create their own funding pages'
  ) THEN
    CREATE POLICY "Users can create their own funding pages"
      ON public.funding_pages FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Check and create update policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'funding_pages' 
    AND policyname = 'Users can update their own funding pages'
  ) THEN
    CREATE POLICY "Users can update their own funding pages"
      ON public.funding_pages FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_funding_pages_user_id ON public.funding_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_funding_pages_slug ON public.funding_pages(slug);
CREATE INDEX IF NOT EXISTS idx_funding_pages_category ON public.funding_pages(category);
CREATE INDEX IF NOT EXISTS idx_funding_pages_is_public ON public.funding_pages(is_public);
CREATE INDEX IF NOT EXISTS idx_funding_pages_is_active ON public.funding_pages(is_active);
CREATE INDEX IF NOT EXISTS idx_funding_pages_created_at ON public.funding_pages(created_at DESC);

-- Add helpful comments
COMMENT ON TABLE public.funding_pages IS 'Fundraising pages created by users to accept Bitcoin donations';
COMMENT ON COLUMN public.funding_pages.is_active IS 'Whether the campaign is active (false for drafts)';
COMMENT ON COLUMN public.funding_pages.is_public IS 'Whether the campaign is publicly visible (false for drafts)';
COMMENT ON COLUMN public.funding_pages.total_funding IS 'Total amount funded so far';
COMMENT ON COLUMN public.funding_pages.contributor_count IS 'Number of contributors'; 