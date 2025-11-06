#!/bin/bash

# Script to apply the foreign key migration to Supabase
# This adds a foreign key relationship between projects.user_id and profiles.id

export PGPASSWORD="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oa3VlaXNsc3R4b21kamF2eWhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDU0Nzk1MCwiZXhwIjoyMDYwMTIzOTUwfQ.2a3ACqjfx_ja_ShHySmh8NuVHlF7gD5k3VXNml9CNbM"

# Read the SQL file and execute it
psql -h aws-0-us-west-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.ohkueislstxomdjavyhs \
     -d postgres \
     -f supabase/migrations/20250206_add_projects_profiles_fk.sql

echo "Migration applied successfully!"
