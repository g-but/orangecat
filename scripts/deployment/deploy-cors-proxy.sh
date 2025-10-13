#!/bin/bash

# Deploy CORS Proxy Edge Function to Supabase
# Make sure you have the Supabase CLI installed: npm install -g supabase

# Set to exit on error
set -e

echo "=== Deploying CORS Proxy Edge Function ==="

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed."
    echo "Please install it with: npm install -g supabase"
    exit 1
fi

# Check if logged in to Supabase
echo "Checking Supabase login status..."
if ! supabase projects list &> /dev/null; then
    echo "You need to log in to Supabase CLI first."
    echo "Run: supabase login"
    exit 1
fi

# Deploy the Edge Function
echo "Deploying CORS proxy Edge Function..."
supabase functions deploy cors-proxy --project-ref "$(supabase projects list --json | jq -r '.[0].ref')"

# Set environment variables for the function
echo "Setting environment variables..."
supabase secrets set SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" --project-ref "$(supabase projects list --json | jq -r '.[0].ref')"

echo "=== Deployment complete! ==="
echo "Your CORS proxy is now available at: https://$(supabase projects list --json | jq -r '.[0].ref').supabase.co/functions/v1/cors-proxy"
echo ""
echo "Test it with:"
echo "curl -X GET \"https://$(supabase projects list --json | jq -r '.[0].ref').supabase.co/functions/v1/cors-proxy?path=/rest/v1/health\"" 