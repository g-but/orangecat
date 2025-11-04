-- One-time storage setup for project media

-- Create storage bucket for project media
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-media', 'project-media', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access (MVP)
CREATE POLICY IF NOT EXISTS "storage_project_media_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-media');

-- Owner can upload files under path project-media/{project_id}/...
CREATE POLICY IF NOT EXISTS "storage_project_media_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-media'
  AND auth.uid() IN (
    SELECT user_id FROM public.projects
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- Owner can delete their files
CREATE POLICY IF NOT EXISTS "storage_project_media_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-media'
  AND auth.uid() IN (
    SELECT user_id FROM public.projects
    WHERE id::text = (storage.foldername(name))[1]
  )
);


