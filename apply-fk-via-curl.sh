#!/bin/bash

# Apply foreign key migration using the Supabase Management API
# This script uses curl to execute SQL directly via the Supabase API

SUPABASE_URL="https://ohkueislstxomdjavyhs.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oa3VlaXNsc3R4b21kamF2eWhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDU0Nzk1MCwiZXhwIjoyMDYwMTIzOTUwfQ.2a3ACqjfx_ja_ShHySmh8NuVHlF7gD5k3VXNml9CNbM"

# SQL to add foreign key
SQL="ALTER TABLE public.projects ADD CONSTRAINT IF NOT EXISTS projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;"

echo "Attempting to add foreign key constraint..."

# We'll try using a stored procedure approach
# First, let's check what endpoints are available
curl -X GET "${SUPABASE_URL}/rest/v1/" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json"
