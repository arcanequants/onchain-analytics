#!/bin/bash

###############################################################################
# Run All Tests Script
#
# Executes all test suites: unit, integration, e2e, load, and security
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
TARGET_URL="${1:-https://vectorialdata.com}"
RUN_LOAD_TESTS="${RUN_LOAD_TESTS:-false}"
RUN_SECURITY_TESTS="${RUN_SECURITY_TESTS:-false}"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   OnChain Analytics - Test Suite      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

PASSED=0
FAILED=0

# Function to run test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"

    echo -e "${YELLOW}▶ Running: $test_name${NC}"
    echo "Command: $test_command"
    echo ""

    if eval "$test_command"; then
        echo -e "${GREEN}✅ PASSED: $test_name${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED: $test_name${NC}"
        ((FAILED++))
    fi
    echo ""
    echo "----------------------------------------"
    echo ""
}

# 1. Unit Tests
run_test "Unit Tests" "npm test"

# 2. TypeScript Type Check
run_test "TypeScript Type Check" "npx tsc --noEmit"

# 3. Linting
run_test "ESLint" "npm run lint"

# 4. Build Test
run_test "Next.js Build" "npm run build"

# 5. Integration Tests (if API is running)
if curl -s "$TARGET_URL/api/health" > /dev/null 2>&1; then
    run_test "API Integration Tests" "npm run test:integration"
else
    echo -e "${YELLOW}⚠️  SKIPPED: Integration Tests (API not reachable at $TARGET_URL)${NC}"
    echo ""
fi

# 6. E2E Tests (Playwright)
if [ -d "tests/e2e" ] && [ "$(ls -A tests/e2e)" ]; then
    echo -e "${YELLOW}▶ E2E Tests require dev server to be running${NC}"
    echo "Starting dev server..."

    # Start dev server in background
    npm run dev > /dev/null 2>&1 &
    DEV_SERVER_PID=$!

    # Wait for server to be ready
    echo "Waiting for dev server..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo "Dev server ready!"
            break
        fi
        sleep 1
    done

    run_test "E2E Tests (Playwright)" "npm run test:e2e"

    # Kill dev server
    kill $DEV_SERVER_PID 2>/dev/null || true
else
    echo -e "${YELLOW}⚠️  SKIPPED: E2E Tests (no tests found)${NC}"
    echo ""
fi

# 7. Load Tests (optional, takes time)
if [ "$RUN_LOAD_TESTS" == "true" ]; then
    if command -v k6 &> /dev/null; then
        run_test "Load Tests" "k6 run tests/load/api-load-test.js --env BASE_URL=$TARGET_URL"
    else
        echo -e "${YELLOW}⚠️  SKIPPED: Load Tests (k6 not installed)${NC}"
        echo "Install: brew install k6"
        echo ""
    fi
else
    echo -e "${YELLOW}⚠️  SKIPPED: Load Tests (set RUN_LOAD_TESTS=true to enable)${NC}"
    echo ""
fi

# 8. Security Tests (optional)
if [ "$RUN_SECURITY_TESTS" == "true" ]; then
    run_test "Security Headers Test" "./tests/security/security-headers-test.sh $TARGET_URL"
    run_test "SSL/TLS Test" "./tests/security/ssl-test.sh ${TARGET_URL/https:\/\//}"

    if command -v docker &> /dev/null; then
        run_test "OWASP ZAP Scan" "./tests/security/zap-scan.sh $TARGET_URL"
    else
        echo -e "${YELLOW}⚠️  SKIPPED: OWASP ZAP (Docker not installed)${NC}"
        echo ""
    fi
else
    echo -e "${YELLOW}⚠️  SKIPPED: Security Tests (set RUN_SECURITY_TESTS=true to enable)${NC}"
    echo ""
fi

# Summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Test Results Summary          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${GREEN}Passed: $PASSED${NC}"
echo -e "  ${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ✅ ALL TESTS PASSED! SHIP IT! 🚀   ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔═══════════════════════════════════════╗${NC}"
    echo -e "${RED}║   ❌ SOME TESTS FAILED - FIX THEM!   ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════╝${NC}"
    exit 1
fi
