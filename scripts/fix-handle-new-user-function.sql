-- Fix handle_new_user function to use email prefix instead of full email address
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, name, created_at, updated_at)
  VALUES (
    NEW.id,
    -- Use email prefix (before @) instead of full email
    COALESCE(
      SPLIT_PART(NEW.email, '@', 1),
      'user_' || SUBSTRING(NEW.id::TEXT, 1, 8)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1),
      'User'
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
