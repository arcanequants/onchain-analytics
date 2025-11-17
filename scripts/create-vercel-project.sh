#!/bin/bash

set -e

echo "🚀 Creating Vercel project for onchain-analytics..."
echo ""

VERCEL_TOKEN="E4SHDXmoBXQo1v3GgJZ7azqQ"

# Create project
curl -X POST "https://api.vercel.com/v10/projects" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "onchain-analytics",
    "framework": "nextjs",
    "gitRepository": {
      "type": "github",
      "repo": "arcanequants/onchain-analytics"
    }
  }'

echo ""
echo "✅ Project created!"
