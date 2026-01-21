-- Create user_documents table for My Cat context
-- Documents provide personal context that My Cat can use to give better advice

-- Create visibility enum
DO $$ BEGIN
  CREATE TYPE document_visibility AS ENUM ('private', 'cat_visible', 'public');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create document type enum
DO $$ BEGIN
  CREATE TYPE document_type AS ENUM ('goals', 'finances', 'skills', 'notes', 'business_plan', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create the user_documents table
CREATE TABLE IF NOT EXISTS user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership (using actor system for future group support)
  actor_id UUID NOT NULL REFERENCES actors(id) ON DELETE CASCADE,

  -- Document content
  title TEXT NOT NULL,
  content TEXT, -- Markdown/plain text content
  file_url TEXT, -- For uploaded files (stored in Supabase Storage)
  file_type TEXT, -- MIME type of uploaded file
  file_size_bytes INTEGER, -- Size of uploaded file

  -- Classification
  document_type document_type NOT NULL DEFAULT 'notes',
  visibility document_visibility NOT NULL DEFAULT 'cat_visible',

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  summary TEXT, -- AI-generated summary for quick context

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_documents_actor_id ON user_documents(actor_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_visibility ON user_documents(visibility);
CREATE INDEX IF NOT EXISTS idx_user_documents_document_type ON user_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_user_documents_created_at ON user_documents(created_at DESC);

-- Full-text search index on title and content
CREATE INDEX IF NOT EXISTS idx_user_documents_search ON user_documents
  USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));

-- Enable RLS
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own documents
CREATE POLICY "Users can view own documents"
  ON user_documents
  FOR SELECT
  USING (
    actor_id IN (
      SELECT id FROM actors WHERE user_id = auth.uid()
    )
  );

-- Users can insert documents for their own actors
CREATE POLICY "Users can create own documents"
  ON user_documents
  FOR INSERT
  WITH CHECK (
    actor_id IN (
      SELECT id FROM actors WHERE user_id = auth.uid()
    )
  );

-- Users can update their own documents
CREATE POLICY "Users can update own documents"
  ON user_documents
  FOR UPDATE
  USING (
    actor_id IN (
      SELECT id FROM actors WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    actor_id IN (
      SELECT id FROM actors WHERE user_id = auth.uid()
    )
  );

-- Users can delete their own documents
CREATE POLICY "Users can delete own documents"
  ON user_documents
  FOR DELETE
  USING (
    actor_id IN (
      SELECT id FROM actors WHERE user_id = auth.uid()
    )
  );

-- Public documents are viewable by anyone
CREATE POLICY "Public documents are viewable by anyone"
  ON user_documents
  FOR SELECT
  USING (visibility = 'public');

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_documents_updated_at ON user_documents;
CREATE TRIGGER trigger_user_documents_updated_at
  BEFORE UPDATE ON user_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_user_documents_updated_at();

-- Create storage bucket for document files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false, -- Private bucket
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'text/plain', 'text/markdown', 'application/json', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket (drop and recreate to handle migrations)
DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
CREATE POLICY "Users can upload own documents"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
CREATE POLICY "Users can view own documents"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
CREATE POLICY "Users can delete own documents"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

COMMENT ON TABLE user_documents IS 'User documents for My Cat context - stores personal information that helps My Cat give personalized advice';
COMMENT ON COLUMN user_documents.visibility IS 'private = only user sees, cat_visible = My Cat can use as context, public = anyone can see';
