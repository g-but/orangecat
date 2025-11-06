#!/bin/bash

# Script to apply the foreign key migration to Supabase
# This adds a foreign key relationship between projects.user_id and profiles.id

export PGPASSWORD="REDACTED_SERVICE_KEY"

# Read the SQL file and execute it
psql -h aws-0-us-west-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.ohkueislstxomdjavyhs \
     -d postgres \
     -f supabase/migrations/20250206_add_projects_profiles_fk.sql

echo "Migration applied successfully!"
