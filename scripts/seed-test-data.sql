-- Seed test data for Discover page testing
-- Run this in Supabase SQL Editor

-- Insert test profile
INSERT INTO profiles (id, username, name, bio, status, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'bitcoin_creator',
  'Alex Bitcoin',
  'Creating innovative Bitcoin solutions and community projects.',
  'active',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert test projects
INSERT INTO projects (name, description, owner_type, owner_id, bitcoin_address, category, status, tags, start_date, created_at, updated_at)
VALUES (
  'Bitcoin Learning Platform',
  'An interactive platform to help people learn about Bitcoin fundamentals, security, and best practices.',
  'profile',
  '550e8400-e29b-41d4-a716-446655440001',
  'bc1qtest123456789',
  'education',
  'active',
  ARRAY['bitcoin', 'education', 'security'],
  NOW(),
  NOW(),
  NOW()
);

INSERT INTO projects (name, description, owner_type, owner_id, bitcoin_address, category, status, tags, start_date, created_at, updated_at)
VALUES (
  'Community Garden Bitcoin Fund',
  'Supporting local community gardens with Bitcoin donations to grow sustainable food sources.',
  'profile',
  '550e8400-e29b-41d4-a716-446655440001',
  'bc1qgarden987654321',
  'community',
  'active',
  ARRAY['community', 'gardening', 'sustainability'],
  NOW(),
  NOW(),
  NOW()
);

