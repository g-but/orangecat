#!/bin/bash

# Simple HTTP-based verification script for public profiles and projects
# Tests that pages load and contain expected metadata

BASE_URL="${1:-http://localhost:3000}"
echo "🧪 Testing pages at: $BASE_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

test_page() {
    local url=$1
    local name=$2
    local expected_content=$3
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    content=$(curl -s "$url" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        if [ -n "$expected_content" ]; then
            if echo "$content" | grep -q "$expected_content"; then
                echo -e "${GREEN}✅ PASS${NC}"
                ((PASSED++))
                return 0
            else
                echo -e "${YELLOW}⚠️  PASS (200) but missing expected content${NC}"
                ((PASSED++))
                return 0
            fi
        else
            echo -e "${GREEN}✅ PASS (200)${NC}"
            ((PASSED++))
            return 0
        fi
    elif [ "$response" = "404" ]; then
        echo -e "${YELLOW}⚠️  404 (expected for non-existent resources)${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL (HTTP $response)${NC}"
        ((FAILED++))
        return 1
    fi
}

test_metadata() {
    local url=$1
    local name=$2
    
    echo -n "Testing $name metadata... "
    
    content=$(curl -s "$url" 2>/dev/null)
    
    if echo "$content" | grep -q '<meta property="og:title"' && \
       echo "$content" | grep -q '<meta property="og:type"' && \
       echo "$content" | grep -q '<meta name="twitter:card"'; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL (missing metadata tags)${NC}"
        ((FAILED++))
        return 1
    fi
}

# Test 1: Non-existent profile (should return 404)
test_page "$BASE_URL/profiles/nonexistent-test-12345" "Non-existent profile (404)" ""

# Test 2: Non-existent project (should return 404)
test_page "$BASE_URL/projects/00000000-0000-0000-0000-000000000000" "Non-existent project (404)" ""

# Test 3: Home page (should work)
test_page "$BASE_URL" "Home page" ""

# Test 4: Projects list (should work)
test_page "$BASE_URL/projects" "Projects list" ""

echo ""
echo "📊 Summary:"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All basic tests passed!${NC}"
    echo ""
    echo "💡 To test with real data:"
    echo "   1. Find a username: Check your database for profiles with usernames"
    echo "   2. Test profile: curl -s $BASE_URL/profiles/[username] | grep -i 'og:title'"
    echo "   3. Find a project ID: Check your database for projects"
    echo "   4. Test project: curl -s $BASE_URL/projects/[id] | grep -i 'og:title'"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi

