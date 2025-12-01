#!/bin/bash
#
# Pre-commit Setup Script
# Phase 3, Week 10 - DevSecOps
#
# Usage: ./scripts/setup-pre-commit.sh

set -e

echo "=========================================="
echo "Pre-commit Hooks Setup"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is required but not installed.${NC}"
    echo "Install Python 3 and try again."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo -e "${RED}Error: pip3 is required but not installed.${NC}"
    echo "Install pip3 and try again."
    exit 1
fi

echo ""
echo "Installing pre-commit..."
pip3 install pre-commit --quiet

echo ""
echo "Installing detect-secrets..."
pip3 install detect-secrets --quiet

echo ""
echo "Installing gitleaks..."
if command -v brew &> /dev/null; then
    # macOS with Homebrew
    brew install gitleaks --quiet 2>/dev/null || echo "gitleaks already installed or brew not available"
elif command -v apt-get &> /dev/null; then
    # Debian/Ubuntu
    echo "Please install gitleaks manually: https://github.com/gitleaks/gitleaks#installing"
else
    echo -e "${YELLOW}Note: Please install gitleaks manually: https://github.com/gitleaks/gitleaks#installing${NC}"
fi

echo ""
echo "Installing pre-commit hooks..."
pre-commit install

echo ""
echo "Installing commit-msg hook..."
pre-commit install --hook-type commit-msg

echo ""
echo "Generating secrets baseline..."
if [ ! -f ".secrets.baseline" ]; then
    detect-secrets scan > .secrets.baseline
    echo "Created .secrets.baseline"
else
    echo ".secrets.baseline already exists"
fi

echo ""
echo "Running initial scan..."
echo "----------------------------------------"
pre-commit run --all-files || true

echo ""
echo "=========================================="
echo -e "${GREEN}Pre-commit setup complete!${NC}"
echo "=========================================="
echo ""
echo "Usage:"
echo "  - Hooks run automatically on commit"
echo "  - Run manually: pre-commit run --all-files"
echo "  - Update hooks: pre-commit autoupdate"
echo "  - Skip hooks: git commit --no-verify"
echo ""
echo "Configuration files:"
echo "  - .pre-commit-config.yaml"
echo "  - .gitleaks.toml"
echo "  - .secrets.baseline"
echo ""
