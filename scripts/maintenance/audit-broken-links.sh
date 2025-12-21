#!/bin/bash

echo "🔍 OrangeCat Link & Route Audit"
echo "================================"
echo ""

echo "1️⃣ Checking Navigation Links vs Actual Routes"
echo "-----------------------------------------------"

# Routes referenced in navigation
NAV_ROUTES=(
  "/blog"
  "/community"
  "/dashboard"
  "/dashboard/info"
  "/dashboard/people"
  "/dashboard/projects"
  "/dashboard/wallets"
  "/discover"
  "/faq"
  "/profiles/me"
  "/settings"
  "/stories"
  "/technology"
)

for route in "${NAV_ROUTES[@]}"; do
  # Convert route to file path
  if [ "$route" = "/profiles/me" ]; then
    filepath="src/app/profiles/[username]/page.tsx"
  else
    filepath="src/app${route}/page.tsx"
    # Check authenticated variant
    auth_filepath="src/app/(authenticated)${route}/page.tsx"
  fi

  if [ -f "$filepath" ] || [ -f "$auth_filepath" ]; then
    echo "✅ $route"
  else
    echo "❌ $route - MISSING PAGE"
  fi
done

echo ""
echo "2️⃣ Checking for Broken Internal Links"
echo "---------------------------------------"

# Find all href links in TSX files
grep -r "href=['\"]/" src/app src/components --include="*.tsx" --include="*.ts" 2>/dev/null | \
  grep -o "href=['\"][^'\"]*" | \
  cut -d'"' -f2 | cut -d"'" -f2 | \
  sort -u | \
  while read -r link; do
    # Skip external links and fragments
    if [[ $link == http* ]] || [[ $link == "#"* ]] || [[ $link == "mailto:"* ]]; then
      continue
    fi

    # Remove query params and fragments for file check
    clean_link=$(echo "$link" | cut -d'?' -f1 | cut -d'#' -f1)

    # Check if page exists
    if [ "$clean_link" = "/" ]; then
      continue
    fi

    filepath="src/app${clean_link}/page.tsx"
    auth_filepath="src/app/(authenticated)${clean_link}/page.tsx"

    if [ ! -f "$filepath" ] && [ ! -f "$auth_filepath" ]; then
      # Check if it's a dynamic route
      if [[ $clean_link == *"["* ]]; then
        echo "⚠️  $link - Dynamic route (check manually)"
      else
        echo "❌ $link - NO PAGE FOUND"
      fi
    fi
  done

echo ""
echo "3️⃣ Pages Without Error Boundaries"
echo "-----------------------------------"

find src/app -name "page.tsx" -type f | while read -r page; do
  if ! grep -q "ErrorBoundary\|error\.tsx" "$page" 2>/dev/null; then
    echo "⚠️  $page - No error boundary"
  fi
done | head -10

echo ""
echo "4️⃣ Missing Page Files (Referenced in Navigation)"
echo "--------------------------------------------------"

# Technology page
if [ ! -f "src/app/technology/page.tsx" ]; then
  echo "❌ /technology page missing (referenced in navigation)"
fi

# Profiles/me redirect
if ! grep -q "profiles/me" src/app/profiles -r 2>/dev/null; then
  echo "⚠️  /profiles/me redirect not found"
fi

echo ""
echo "✅ Audit Complete!"
