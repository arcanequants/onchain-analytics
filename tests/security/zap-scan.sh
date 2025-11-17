#!/bin/bash

###############################################################################
# OWASP ZAP Security Scan Script
#
# This script runs ZAP (Zed Attack Proxy) security scans against the app
###############################################################################

set -e

# Configuration
TARGET_URL="${1:-https://vectorialdata.com}"
ZAP_PORT="${ZAP_PORT:-8090}"
REPORT_DIR="tests/security/reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting OWASP ZAP Security Scan${NC}"
echo "Target: $TARGET_URL"
echo "Report Directory: $REPORT_DIR"
echo ""

# Create report directory
mkdir -p "$REPORT_DIR"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is required but not installed${NC}"
    echo "Install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if ZAP Docker image exists, pull if not
if ! docker images | grep -q "zaproxy/zap-stable"; then
    echo -e "${YELLOW}Pulling OWASP ZAP Docker image...${NC}"
    docker pull zaproxy/zap-stable
fi

echo -e "${GREEN}Running baseline scan...${NC}"
docker run --rm \
    -v "$(pwd)/$REPORT_DIR:/zap/wrk:rw" \
    -t zaproxy/zap-stable \
    zap-baseline.py \
    -t "$TARGET_URL" \
    -r "baseline_${TIMESTAMP}.html" \
    -J "baseline_${TIMESTAMP}.json" \
    -w "baseline_${TIMESTAMP}.md" \
    || true

echo ""
echo -e "${GREEN}Running API scan...${NC}"
docker run --rm \
    -v "$(pwd)/$REPORT_DIR:/zap/wrk:rw" \
    -t zaproxy/zap-stable \
    zap-api-scan.py \
    -t "$TARGET_URL/api" \
    -r "api_scan_${TIMESTAMP}.html" \
    -J "api_scan_${TIMESTAMP}.json" \
    -w "api_scan_${TIMESTAMP}.md" \
    || true

echo ""
echo -e "${GREEN}Scan complete!${NC}"
echo "Reports saved to: $REPORT_DIR"
echo ""
echo "HTML Report: $REPORT_DIR/baseline_${TIMESTAMP}.html"
echo "JSON Report: $REPORT_DIR/baseline_${TIMESTAMP}.json"
echo "Markdown Report: $REPORT_DIR/baseline_${TIMESTAMP}.md"
echo ""

# Check for high-risk issues
if [ -f "$REPORT_DIR/baseline_${TIMESTAMP}.json" ]; then
    HIGH_RISK=$(grep -o '"riskcode": "3"' "$REPORT_DIR/baseline_${TIMESTAMP}.json" | wc -l || echo "0")
    MEDIUM_RISK=$(grep -o '"riskcode": "2"' "$REPORT_DIR/baseline_${TIMESTAMP}.json" | wc -l || echo "0")

    echo -e "${YELLOW}Summary:${NC}"
    echo "  High Risk Issues: $HIGH_RISK"
    echo "  Medium Risk Issues: $MEDIUM_RISK"
    echo ""

    if [ "$HIGH_RISK" -gt "0" ]; then
        echo -e "${RED}⚠️  WARNING: High-risk security issues found!${NC}"
        echo "Please review the report and fix critical issues."
        exit 1
    fi
fi

echo -e "${GREEN}✅ Security scan completed successfully${NC}"
