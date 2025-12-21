-- Create a test product for demonstration
INSERT INTO user_products (
  user_id,
  title,
  description,
  price_sats,
  currency,
  product_type,
  inventory_count,
  fulfillment_type,
  category,
  status
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000', -- test user ID
  'Handmade Ceramic Mug',
  'Beautiful handcrafted ceramic mug perfect for your morning coffee. Made with high-quality clay and glazed for durability.',
  2500, -- 0.0025 BTC in sats
  'SATS',
  'physical',
  -1, -- unlimited stock
  'manual',
  'Handmade',
  'active'
) ON CONFLICT DO NOTHING;

-- Also create the user if they don't exist
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '550e8400-e29b-41d4-a716-446655440000',
  'authenticated',
  'authenticated',
  'test2@example.com',
  crypt('testpassword123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}'
) ON CONFLICT (id) DO NOTHING;

-- Create corresponding profile
INSERT INTO profiles (
  id,
  username,
  full_name,
  bio,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'testuser2',
  'Test User',
  'Test user for local development',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;



