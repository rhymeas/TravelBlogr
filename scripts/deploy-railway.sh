#!/bin/bash

# TravelBlogr Railway Deployment Script
# This script helps you deploy to Railway.app

echo "🚂 TravelBlogr Railway Deployment Helper"
echo "=========================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Railway CLI not found. Installing..."
    npm install -g @railway/cli
else
    echo "✅ Railway CLI is installed"
fi

echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Login to Railway:"
echo "   railway login"
echo ""
echo "2. Initialize project:"
echo "   railway init"
echo ""
echo "3. Link to your GitHub repo (if not auto-detected):"
echo "   railway link"
echo ""
echo "4. Add environment variables:"
echo "   railway variables set NEXT_PUBLIC_SUPABASE_URL=https://nchhcxokrzabbkvhzsor.supabase.co"
echo "   railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-key>"
echo "   railway variables set SUPABASE_SERVICE_ROLE_KEY=<your-key>"
echo "   railway variables set GROQ_API_KEY=<your-key>"
echo "   railway variables set GEONAMES_USERNAME=travelblogr"
echo "   railway variables set PEXELS_API_KEY=<your-key>"
echo "   railway variables set UNSPLASH_ACCESS_KEY=<your-key>"
echo "   railway variables set NODE_ENV=production"
echo ""
echo "5. Deploy:"
echo "   railway up"
echo ""
echo "6. Open your app:"
echo "   railway open"
echo ""
echo "📚 Full guide: See railway-deployment-guide.md"
echo ""

