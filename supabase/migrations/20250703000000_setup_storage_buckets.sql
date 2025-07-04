-- =====================================================================
-- STORAGE BUCKETS SETUP FOR AVATAR AND BANNER UPLOADS
-- =====================================================================
-- Migration: 20250703000000_setup_storage_buckets.sql
-- Created: 2025-07-03
-- Purpose: Create storage buckets for profile images
-- =====================================================================

-- Create avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create banners bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- STORAGE POLICIES
-- =====================================================================

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for users to upload their own avatars
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for users to update their own avatars
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for users to delete their own avatars
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for public access to avatar images
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Policy for users to upload their own banners
DROP POLICY IF EXISTS "Users can upload their own banners" ON storage.objects;
CREATE POLICY "Users can upload their own banners"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'banners' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for users to update their own banners
DROP POLICY IF EXISTS "Users can update their own banners" ON storage.objects;
CREATE POLICY "Users can update their own banners"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'banners' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for users to delete their own banners
DROP POLICY IF EXISTS "Users can delete their own banners" ON storage.objects;
CREATE POLICY "Users can delete their own banners"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'banners' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for public access to banner images
DROP POLICY IF EXISTS "Banner images are publicly accessible" ON storage.objects;
CREATE POLICY "Banner images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

-- =====================================================================
-- HELPER FUNCTIONS
-- =====================================================================

-- Function to get storage bucket info
CREATE OR REPLACE FUNCTION public.get_storage_bucket_info()
RETURNS TABLE (
  bucket_name text,
  is_public boolean,
  file_count bigint,
  total_size bigint
)
LANGUAGE SQL
AS $$
  SELECT 
    b.name as bucket_name,
    b.public as is_public,
    COUNT(o.id) as file_count,
    COALESCE(SUM(o.metadata->>'size')::bigint, 0) as total_size
  FROM storage.buckets b
  LEFT JOIN storage.objects o ON b.id = o.bucket_id
  WHERE b.id IN ('avatars', 'banners')
  GROUP BY b.name, b.public
  ORDER BY b.name;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.get_storage_bucket_info() TO authenticated;

-- =====================================================================
-- MIGRATION COMPLETE
-- =====================================================================

-- This migration ensures:
-- ✅ Avatar and banner storage buckets exist
-- ✅ Proper RLS policies for secure file access
-- ✅ Users can only manage their own files
-- ✅ Public read access to uploaded images
-- ✅ Helper functions for monitoring storage usage