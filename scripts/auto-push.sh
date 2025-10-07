#!/bin/bash
# Automated Git Push Script
# Usage: ./scripts/auto-push.sh "commit message"

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Auto Push Script${NC}"
echo ""

# Get commit message from argument or use default
COMMIT_MSG="${1:-chore: automated commit}"

# Check if there are changes
if [[ -z $(git status -s) ]]; then
    echo -e "${GREEN}✅ No changes to commit${NC}"
    exit 0
fi

# Show status
echo -e "${BLUE}📊 Changes:${NC}"
git status -s
echo ""

# Add all changes
echo -e "${BLUE}📦 Adding all changes...${NC}"
git add -A

# Commit
echo -e "${BLUE}💾 Committing: ${COMMIT_MSG}${NC}"
git commit -m "$COMMIT_MSG"

# Push
echo -e "${BLUE}⬆️  Pushing to GitHub...${NC}"
git push origin main

echo ""
echo -e "${GREEN}✅ Successfully pushed to GitHub!${NC}"

