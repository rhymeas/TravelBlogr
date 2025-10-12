#!/bin/bash

# Railway Environment Variables Setup Script
# Helps you set up all required environment variables in Railway

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Railway Environment Variables Setup Helper  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}Railway CLI is not installed.${NC}"
    echo ""
    echo "You have two options:"
    echo ""
    echo -e "${BLUE}Option 1: Install Railway CLI (Recommended)${NC}"
    echo "  npm install -g @railway/cli"
    echo "  Then run this script again"
    echo ""
    echo -e "${BLUE}Option 2: Set variables manually in Railway UI${NC}"
    echo "  1. Go to https://railway.app"
    echo "  2. Select your project"
    echo "  3. Go to Variables tab"
    echo "  4. Add the following variables:"
    echo ""
    echo "  Required variables:"
    echo "    NEXT_PUBLIC_SUPABASE_URL"
    echo "    NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "    SUPABASE_SERVICE_ROLE_KEY"
    echo "    GROQ_API_KEY"
    echo "    NODE_ENV=production"
    echo ""
    echo "  Optional variables:"
    echo "    NEXT_PUBLIC_SITE_URL"
    echo "    GEONAMES_USERNAME"
    echo "    PEXELS_API_KEY"
    echo "    UNSPLASH_ACCESS_KEY"
    echo ""
    exit 0
fi

echo -e "${GREEN}✅ Railway CLI is installed${NC}"
echo ""

# Check if logged in to Railway
if ! railway whoami &> /dev/null; then
    echo -e "${YELLOW}Not logged in to Railway.${NC}"
    echo "Logging in..."
    railway login
fi

echo -e "${GREEN}✅ Logged in to Railway${NC}"
echo ""

# Link to project if not already linked
if [ ! -f "railway.json" ]; then
    echo -e "${YELLOW}Project not linked to Railway.${NC}"
    echo "Linking project..."
    railway link
fi

echo -e "${GREEN}✅ Project linked${NC}"
echo ""

# Function to set variable
set_railway_var() {
    local var_name=$1
    local var_description=$2
    local is_required=$3
    local default_value=$4
    
    echo -e "${BLUE}Setting: ${var_name}${NC}"
    echo "  Description: $var_description"
    
    if [ -n "$default_value" ]; then
        echo "  Default: $default_value"
    fi
    
    if [ "$is_required" = "true" ]; then
        echo -e "  ${RED}(Required)${NC}"
    else
        echo -e "  ${YELLOW}(Optional)${NC}"
    fi
    
    read -p "  Enter value (or press Enter to skip): " var_value
    
    if [ -n "$var_value" ]; then
        railway variables --set "$var_name=$var_value"
        echo -e "  ${GREEN}✅ Set $var_name${NC}"
    elif [ "$is_required" = "true" ]; then
        echo -e "  ${RED}⚠️  Warning: Required variable not set${NC}"
    else
        echo -e "  ${YELLOW}⏭️  Skipped${NC}"
    fi
    
    echo ""
}

# Set all required variables
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Required Variables${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

set_railway_var "NEXT_PUBLIC_SUPABASE_URL" "Supabase project URL" "true" "https://nchhcxokrzabbkvhzsor.supabase.co"
set_railway_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "Supabase anonymous key" "true" ""
set_railway_var "SUPABASE_SERVICE_ROLE_KEY" "Supabase service role key (server-side)" "true" ""
set_railway_var "GROQ_API_KEY" "Groq API key for AI itinerary generation" "true" ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Optional Variables${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

set_railway_var "NODE_ENV" "Node environment" "false" "production"
set_railway_var "NEXT_PUBLIC_SITE_URL" "Public site URL" "false" ""
set_railway_var "GEONAMES_USERNAME" "GeoNames API username" "false" "travelblogr"
set_railway_var "PEXELS_API_KEY" "Pexels API key for images" "false" ""
set_railway_var "UNSPLASH_ACCESS_KEY" "Unsplash API key for images" "false" ""

# Summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Environment Variables Set             ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""

echo "Current variables:"
railway variables

echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Verify all variables are correct above"
echo "  2. Run deployment script: ./scripts/auto-deploy-railway.sh"
echo "  3. Monitor Railway dashboard for build status"
echo ""

echo -e "${YELLOW}Important:${NC}"
echo "  - After setting variables, you MUST trigger a rebuild"
echo "  - The deployment script will do this automatically"
echo "  - Or push a commit to trigger rebuild manually"
echo ""

