#!/bin/bash
# Test profile save with authentication

# First, let's see if we can access the profile endpoint
echo "Testing profile save..."

# Get auth cookies from browser (you'll need to be logged in)
# For now, let's just trigger a request to see server logs

curl -X PUT http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "name": "Test User",
    "bio": "Test bio",
    "location": "Zurich, Switzerland",
    "website": "https://example.com",
    "contact_email": "test@example.com"
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' || cat

echo ""
echo "Check server logs above for detailed validation errors"
