#!/bin/bash

###############################################################################
# Security Headers Test
#
# Tests for proper security headers in HTTP responses
###############################################################################

set -e

TARGET_URL="${1:-https://vectorialdata.com}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Testing Security Headers${NC}"
echo "Target: $TARGET_URL"
echo ""

PASSED=0
FAILED=0
WARNINGS=0

# Function to test header
test_header() {
    local header_name="$1"
    local expected_pattern="$2"
    local severity="${3:-CRITICAL}"  # CRITICAL, WARNING

    echo -n "Testing $header_name... "

    HEADER_VALUE=$(curl -s -I "$TARGET_URL" | grep -i "^$header_name:" | cut -d' ' -f2- | tr -d '\r\n')

    if [ -z "$HEADER_VALUE" ]; then
        if [ "$severity" == "CRITICAL" ]; then
            echo -e "${RED}FAIL${NC} - Header not present"
            ((FAILED++))
        else
            echo -e "${YELLOW}WARNING${NC} - Header not present"
            ((WARNINGS++))
        fi
        return 1
    fi

    if [[ "$HEADER_VALUE" =~ $expected_pattern ]]; then
        echo -e "${GREEN}PASS${NC} - $HEADER_VALUE"
        ((PASSED++))
        return 0
    else
        echo -e "${YELLOW}WARNING${NC} - Found: $HEADER_VALUE"
        ((WARNINGS++))
        return 1
    fi
}

# Critical Security Headers
echo -e "${GREEN}Critical Headers:${NC}"
test_header "Strict-Transport-Security" "max-age=" "CRITICAL"
test_header "X-Frame-Options" "DENY|SAMEORIGIN" "CRITICAL"
test_header "X-Content-Type-Options" "nosniff" "CRITICAL"
test_header "Content-Security-Policy" "." "CRITICAL"

echo ""
echo -e "${GREEN}Recommended Headers:${NC}"
test_header "X-XSS-Protection" "1" "WARNING"
test_header "Referrer-Policy" "." "WARNING"
test_header "Permissions-Policy" "." "WARNING"

echo ""
echo -e "${GREEN}Summary:${NC}"
echo -e "  Passed: ${GREEN}$PASSED${NC}"
echo -e "  Warnings: ${YELLOW}$WARNINGS${NC}"
echo -e "  Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ Critical security headers missing!${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All critical security headers present${NC}"
fi
