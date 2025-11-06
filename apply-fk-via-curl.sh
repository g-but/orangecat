#!/bin/bash

# Apply foreign key migration using the Supabase Management API
# This script uses curl to execute SQL directly via the Supabase API

SUPABASE_URL="https://ohkueislstxomdjavyhs.supabase.co"
SERVICE_ROLE_KEY="REDACTED_SERVICE_KEY"

# SQL to add foreign key
SQL="ALTER TABLE public.projects ADD CONSTRAINT IF NOT EXISTS projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;"

echo "Attempting to add foreign key constraint..."

# We'll try using a stored procedure approach
# First, let's check what endpoints are available
curl -X GET "${SUPABASE_URL}/rest/v1/" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json"
