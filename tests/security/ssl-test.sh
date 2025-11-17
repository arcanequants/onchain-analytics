#!/bin/bash

###############################################################################
# SSL/TLS Configuration Test
#
# Tests SSL/TLS security configuration
###############################################################################

set -e

TARGET_DOMAIN="${1:-vectorialdata.com}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Testing SSL/TLS Configuration${NC}"
echo "Target: $TARGET_DOMAIN"
echo ""

# Check if openssl is installed
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}Error: openssl is required but not installed${NC}"
    exit 1
fi

# Test SSL certificate
echo "Checking SSL certificate..."
CERT_INFO=$(echo | openssl s_client -servername "$TARGET_DOMAIN" -connect "$TARGET_DOMAIN:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)

if [ -z "$CERT_INFO" ]; then
    echo -e "${RED}FAIL${NC} - Could not retrieve SSL certificate"
    exit 1
fi

echo -e "${GREEN}Certificate Info:${NC}"
echo "$CERT_INFO"
echo ""

# Check certificate expiry
EXPIRY_DATE=$(echo "$CERT_INFO" | grep "notAfter" | cut -d= -f2)
EXPIRY_TIMESTAMP=$(date -j -f "%b %d %H:%M:%S %Y %Z" "$EXPIRY_DATE" +%s 2>/dev/null || date -d "$EXPIRY_DATE" +%s 2>/dev/null)
CURRENT_TIMESTAMP=$(date +%s)
DAYS_UNTIL_EXPIRY=$(( ($EXPIRY_TIMESTAMP - $CURRENT_TIMESTAMP) / 86400 ))

echo "Certificate expires in: $DAYS_UNTIL_EXPIRY days"

if [ $DAYS_UNTIL_EXPIRY -lt 30 ]; then
    echo -e "${RED}WARNING${NC} - Certificate expires soon!"
elif [ $DAYS_UNTIL_EXPIRY -lt 60 ]; then
    echo -e "${YELLOW}WARNING${NC} - Certificate expires in less than 60 days"
else
    echo -e "${GREEN}OK${NC} - Certificate is valid"
fi

echo ""

# Test TLS versions
echo "Testing TLS versions..."

for version in tls1 tls1_1 tls1_2 tls1_3; do
    echo -n "  $version: "
    if echo | openssl s_client -$version -connect "$TARGET_DOMAIN:443" 2>&1 | grep -q "Cipher"; then
        if [ "$version" == "tls1" ] || [ "$version" == "tls1_1" ]; then
            echo -e "${YELLOW}ENABLED (Should be disabled)${NC}"
        else
            echo -e "${GREEN}ENABLED${NC}"
        fi
    else
        if [ "$version" == "tls1_2" ] || [ "$version" == "tls1_3" ]; then
            echo -e "${RED}DISABLED (Should be enabled)${NC}"
        else
            echo -e "${GREEN}DISABLED${NC}"
        fi
    fi
done

echo ""
echo -e "${GREEN}✅ SSL/TLS test complete${NC}"
