-- Restrict public storage bucket SELECT policies to authenticated users only.
-- Public buckets still serve files by URL without any policy — these policies
-- only gate the storage.objects API (listing). Anonymous users should not be
-- able to enumerate filenames (which often encode user IDs or sensitive paths).

-- avatars: replace broad anonymous SELECT with authenticated-only
DROP POLICY IF EXISTS "Public avatars bucket is publicly readable" ON storage.objects;
CREATE POLICY "avatars_authenticated_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

-- proofs: replace broad anonymous SELECT with authenticated-only
DROP POLICY IF EXISTS "proofs_public_read" ON storage.objects;
CREATE POLICY "proofs_authenticated_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'proofs' AND auth.uid() IS NOT NULL);

-- project-media: replace broad anonymous SELECT with authenticated-only
DROP POLICY IF EXISTS "storage_project_media_read" ON storage.objects;
CREATE POLICY "project_media_authenticated_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'project-media' AND auth.uid() IS NOT NULL);
