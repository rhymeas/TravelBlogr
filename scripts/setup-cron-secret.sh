#!/bin/bash

# Setup Cron Secret for Railway
# This script generates a secure random secret for cron job authentication

set -e

echo "🔐 TravelBlogr - Cron Secret Setup"
echo "=================================="
echo ""

# Generate secure random secret
CRON_SECRET=$(openssl rand -base64 32)

echo "✅ Generated secure CRON_SECRET:"
echo ""
echo "   $CRON_SECRET"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Copy the secret above"
echo ""
echo "2. Add to Railway:"
echo "   - Go to https://railway.app/dashboard"
echo "   - Select your TravelBlogr project"
echo "   - Click on your service"
echo "   - Go to 'Variables' tab"
echo "   - Click 'New Variable'"
echo "   - Name: CRON_SECRET"
echo "   - Value: [paste the secret above]"
echo "   - Click 'Add'"
echo ""
echo "3. Or use Railway CLI:"
echo "   railway variables set CRON_SECRET=\"$CRON_SECRET\""
echo ""
echo "4. Then set up cron jobs following: docs/RAILWAY_CRON_SETUP.md"
echo ""
echo "🔒 Keep this secret secure! Don't commit it to git."
echo ""

