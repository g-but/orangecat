-- Migration: Create proofs storage bucket for wishlist fulfillment proofs
-- Created: 2026-01-09
-- Purpose: Enable image uploads for wishlist proof of purchase/fulfillment

-- =====================================================
-- STORAGE BUCKET SETUP
-- =====================================================

-- Create storage bucket for proof images (receipts, screenshots)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'proofs',
  'proofs',
  true,  -- Public read access for transparency
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Policy: Anyone can view proof images (transparency is key)
DROP POLICY IF EXISTS "proofs_public_read" ON storage.objects;
CREATE POLICY "proofs_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'proofs');

-- Policy: Authenticated users can upload proof images
-- Files are stored as: {wishlist_item_id}/{proof_type}_{timestamp}.{ext}
DROP POLICY IF EXISTS "proofs_authenticated_insert" ON storage.objects;
CREATE POLICY "proofs_authenticated_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'proofs'
  AND auth.uid() IS NOT NULL
);

-- Policy: Users can only delete their own proof files
-- This checks if the user owns the wishlist item the proof belongs to
DROP POLICY IF EXISTS "proofs_owner_delete" ON storage.objects;
CREATE POLICY "proofs_owner_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'proofs'
  AND auth.uid() IN (
    SELECT w.actor_id
    FROM wishlists w
    INNER JOIN wishlist_items wi ON wi.wishlist_id = w.id
    WHERE wi.id::text = (storage.foldername(name))[1]
  )
);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "proofs_public_read" ON storage.objects IS
'Allow anyone to view proof images - transparency is core to the platform';

COMMENT ON POLICY "proofs_authenticated_insert" ON storage.objects IS
'Allow authenticated users to upload proof images';

COMMENT ON POLICY "proofs_owner_delete" ON storage.objects IS
'Allow wishlist owners to delete proof files for their items';
