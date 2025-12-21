-- Create a test user for local development
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  email_change_token_current,
  email_change_confirm_status
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '123e4567-e89b-12d3-a456-426614174000',
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('testpassword123', gen_salt('bf')),
  now(),
  NULL,
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  NULL,
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false,
  now(),
  now(),
  NULL,
  NULL,
  '',
  0
) ON CONFLICT (id) DO NOTHING;

-- Create corresponding profile
INSERT INTO profiles (
  id,
  username,
  display_name,
  bio,
  avatar_url,
  location,
  website,
  created_at,
  updated_at
) VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'testuser',
  'Test User',
  'Test user for local development',
  NULL,
  'Local',
  NULL,
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;
































