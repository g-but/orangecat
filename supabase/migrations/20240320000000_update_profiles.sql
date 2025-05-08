-- Update profiles table
ALTER TABLE profiles
  -- Make username optional
  ALTER COLUMN username DROP NOT NULL,
  
  -- Add new columns
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS bitcoin_address TEXT,
  ADD COLUMN IF NOT EXISTS lightning_address TEXT,
  ADD COLUMN IF NOT EXISTS total_funding DECIMAL(20, 8) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contributor_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_bitcoin_address ON profiles(bitcoin_address);
CREATE INDEX IF NOT EXISTS idx_profiles_lightning_address ON profiles(lightning_address);

-- Add constraints
ALTER TABLE profiles
  ADD CONSTRAINT unique_username UNIQUE (username),
  ADD CONSTRAINT valid_bitcoin_address CHECK (
    bitcoin_address IS NULL OR 
    bitcoin_address ~ '^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$'
  ),
  ADD CONSTRAINT valid_lightning_address CHECK (
    lightning_address IS NULL OR 
    lightning_address ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
  );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 