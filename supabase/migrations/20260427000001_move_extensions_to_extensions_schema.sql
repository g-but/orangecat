-- Move pg_trgm and vector extensions from public to extensions schema.
-- The extensions schema already exists and is in search_path ("$user", public, extensions),
-- so all function references (similarity(), <->, etc.) continue to resolve correctly.
-- Resolves the extension_in_public security advisory (2 WARN items).
ALTER EXTENSION pg_trgm SET SCHEMA extensions;
ALTER EXTENSION vector SET SCHEMA extensions;
