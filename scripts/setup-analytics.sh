#!/bin/bash

# Setup Analytics System
# This script creates the performance_metrics table and functions in Supabase

echo "🚀 Setting up TravelBlogr Analytics System..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo ""
echo "📊 Creating performance_metrics table..."
supabase db push --file infrastructure/database/create-performance-metrics-table.sql

if [ $? -eq 0 ]; then
    echo "✅ Analytics system setup complete!"
    echo ""
    echo "📈 Next steps:"
    echo "1. Deploy your app to Railway"
    echo "2. Visit /dashboard/admin/analytics to view metrics"
    echo "3. Monitor performance and errors in real-time"
    echo ""
    echo "🔍 Available analytics:"
    echo "   - Page render times (avg, p50, p95, p99)"
    echo "   - Cache hit/miss rates"
    echo "   - Database query performance"
    echo "   - Error tracking with stack traces"
    echo "   - Slowest pages analysis"
else
    echo "❌ Failed to setup analytics system"
    exit 1
fi

