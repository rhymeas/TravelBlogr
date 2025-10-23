#!/bin/bash

# 🛡️ BULLETPROOF DEPLOYMENT SCRIPT - KEEPS ALL CHANGES FROM TODAY
# This script ensures NOTHING gets lost during deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🛡️  BULLETPROOF DEPLOYMENT - KEEPING ALL CHANGES${NC}"
echo "=================================================="
echo ""

# Step 1: Verify we're on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${RED}❌ ERROR: Not on main branch (currently on $CURRENT_BRANCH)${NC}"
    echo "Switch to main first: git checkout main"
    exit 1
fi

echo -e "${GREEN}✅ On main branch${NC}"
echo ""

# Step 2: Check for uncommitted changes
UNCOMMITTED=$(git status --short | wc -l)
if [ "$UNCOMMITTED" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $UNCOMMITTED uncommitted changes${NC}"
    echo ""
    echo "Changes to commit:"
    git status --short | head -20
    echo ""
    
    # Stage all changes
    echo -e "${BLUE}📦 Staging all changes...${NC}"
    git add .
    
    # Commit with timestamp
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    git commit -m "feat: daily changes - $TIMESTAMP

- Randomized in-feed ad placements on locations grid
- Deterministic daily seed for stable layout
- Support for NEXT_PUBLIC_ADS_SLOT_LOCATIONS_INFEED env var
- All changes from today preserved"
    
    echo -e "${GREEN}✅ All changes committed${NC}"
    echo ""
fi

# Step 3: Verify build works locally
echo -e "${BLUE}🔨 Verifying build locally...${NC}"
npm run type-check
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed - fix errors before deploying${NC}"
    exit 1
fi
echo ""

# Step 4: Show what we're about to push
echo -e "${BLUE}📊 Commits to push:${NC}"
git log origin/main..HEAD --oneline
echo ""

# Step 5: Push to GitHub (backup everything)
echo -e "${BLUE}📤 Pushing to GitHub (backing up all changes)...${NC}"
git push origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Pushed to GitHub - all changes backed up${NC}"
else
    echo -e "${RED}❌ Push failed${NC}"
    exit 1
fi
echo ""

# Step 6: Verify push succeeded
echo -e "${BLUE}🔍 Verifying push...${NC}"
REMOTE_COMMIT=$(git rev-parse origin/main)
LOCAL_COMMIT=$(git rev-parse HEAD)

if [ "$REMOTE_COMMIT" = "$LOCAL_COMMIT" ]; then
    echo -e "${GREEN}✅ Local and remote are in sync${NC}"
else
    echo -e "${RED}❌ Push verification failed${NC}"
    exit 1
fi
echo ""

# Step 7: Summary
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ DEPLOYMENT READY${NC}"
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo ""
echo "All changes from today have been:"
echo "  ✅ Committed to git"
echo "  ✅ Pushed to GitHub (backed up)"
echo "  ✅ Build verified locally"
echo ""
echo "Next steps:"
echo "  1. Railway will auto-deploy from main branch"
echo "  2. Monitor: https://railway.app/project/[project-id]"
echo "  3. Check deployment logs for any errors"
echo ""
echo "If Railway deployment fails:"
echo "  - Check Railway logs for error details"
echo "  - All code is safely backed up on GitHub"
echo "  - You can rollback with: git revert HEAD"
echo ""

