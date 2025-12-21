#!/bin/bash
# Test login -> profile edit flow

BASE_URL="http://localhost:3000"

echo "1. Testing homepage..."
curl -s "$BASE_URL" | grep -q "orangecat" && echo "✓ Homepage loads" || echo "✗ Homepage failed"

echo "2. Testing auth page..."
curl -s "$BASE_URL/auth" | grep -q "auth" && echo "✓ Auth page loads" || echo "✗ Auth page failed"

echo "3. Testing dashboard redirect (should redirect to /auth)..."
REDIRECT=$(curl -s -o /dev/null -w "%{redirect_url}" "$BASE_URL/dashboard")
[[ "$REDIRECT" == *"/auth"* ]] && echo "✓ Dashboard redirects to auth" || echo "✗ Dashboard redirect failed"

echo "4. Testing profile edit page (should redirect to /auth)..."
REDIRECT=$(curl -s -o /dev/null -w "%{redirect_url}" "$BASE_URL/profile/edit")
[[ "$REDIRECT" == *"/auth"* ]] && echo "✓ Profile edit redirects to auth" || echo "✗ Profile edit redirect failed"
