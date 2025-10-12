#!/bin/bash

# Quick Deploy Script - Minimal checks, fast deployment

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Quick Deploy to Railway${NC}"
echo ""

# Quick build test
echo "Testing build..."
cd apps/web && npm run build && cd ../..

# Commit and push
echo ""
echo "Committing changes..."
git add .
git commit -m "deploy: Quick deployment to Railway" || git commit --allow-empty -m "deploy: Trigger Railway rebuild"

echo ""
echo "Pushing to remote..."
git push origin $(git rev-parse --abbrev-ref HEAD)

echo ""
echo -e "${GREEN}✅ Deployed! Check Railway dashboard for build status.${NC}"

