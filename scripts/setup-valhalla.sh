#!/bin/bash

# Valhalla Setup Script for TravelBlogr
# This script sets up a local Valhalla routing engine for development

set -e

echo "🚀 TravelBlogr - Valhalla Setup Script"
echo "======================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ Docker is installed"
echo ""

# Create data directory
DATA_DIR="$HOME/valhalla-data"
mkdir -p "$DATA_DIR"
echo "✅ Created data directory: $DATA_DIR"
echo ""

# Check if OSM data already exists
if [ -f "$DATA_DIR/canada-latest.osm.pbf" ]; then
    echo "✅ OSM data already downloaded"
else
    echo "📥 Downloading Canada OSM data (~5GB)..."
    echo "   This may take 10-30 minutes depending on your internet speed..."
    echo ""
    
    wget -O "$DATA_DIR/canada-latest.osm.pbf" \
        https://download.geofabrik.de/north-america/canada-latest.osm.pbf
    
    echo ""
    echo "✅ OSM data downloaded"
fi

echo ""

# Pull Valhalla Docker image
echo "🐳 Pulling Valhalla Docker image..."
docker pull ghcr.io/valhalla/valhalla-scripted:latest
echo "✅ Valhalla image pulled"
echo ""

# Stop existing container if running
if docker ps -a | grep -q valhalla; then
    echo "🛑 Stopping existing Valhalla container..."
    docker stop valhalla 2>/dev/null || true
    docker rm valhalla 2>/dev/null || true
    echo "✅ Existing container removed"
    echo ""
fi

# Run Valhalla container
echo "🚀 Starting Valhalla container..."
echo "   This will build routing tiles (10-30 minutes for Canada)"
echo "   You can monitor progress with: docker logs -f valhalla"
echo ""

docker run -d \
  --name valhalla \
  -p 8002:8002 \
  -v "$DATA_DIR:/custom_files" \
  -e tile_urls=/custom_files/canada-latest.osm.pbf \
  ghcr.io/valhalla/valhalla-scripted:latest

echo "✅ Valhalla container started"
echo ""

# Wait for service to be ready
echo "⏳ Waiting for Valhalla service to start..."
echo "   (This may take 10-30 minutes while tiles are being built)"
echo ""

MAX_WAIT=1800  # 30 minutes
ELAPSED=0
INTERVAL=10

while [ $ELAPSED -lt $MAX_WAIT ]; do
    if curl -s http://localhost:8002/status > /dev/null 2>&1; then
        echo ""
        echo "✅ Valhalla service is ready!"
        break
    fi
    
    echo -n "."
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
    echo ""
    echo "⚠️  Valhalla service did not start within 30 minutes"
    echo "   Check logs with: docker logs valhalla"
    exit 1
fi

echo ""
echo "🧪 Testing Valhalla API..."
echo ""

# Test basic route
RESPONSE=$(curl -s "http://localhost:8002/route" \
  -H "Content-Type: application/json" \
  -d '{
    "locations": [
      {"lat": 49.2827, "lon": -123.1207},
      {"lat": 51.1784, "lon": -115.5708}
    ],
    "costing": "auto"
  }')

if echo "$RESPONSE" | grep -q "trip"; then
    DISTANCE=$(echo "$RESPONSE" | jq -r '.trip.summary.length')
    DURATION=$(echo "$RESPONSE" | jq -r '.trip.summary.time / 60 | floor')
    
    echo "✅ Valhalla API is working!"
    echo "   Test route (Vancouver → Banff):"
    echo "   Distance: ${DISTANCE}km"
    echo "   Duration: ${DURATION} minutes"
else
    echo "❌ Valhalla API test failed"
    echo "   Response: $RESPONSE"
    exit 1
fi

echo ""
echo "🎉 Valhalla setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Add to .env.local:"
echo "      VALHALLA_URL=http://localhost:8002"
echo ""
echo "   2. Restart your Next.js dev server:"
echo "      npm run dev"
echo ""
echo "   3. Test scenic routes at:"
echo "      http://localhost:3000/test/route-strategies"
echo ""
echo "📊 Useful commands:"
echo "   - View logs:    docker logs -f valhalla"
echo "   - Stop service: docker stop valhalla"
echo "   - Start service: docker start valhalla"
echo "   - Remove service: docker stop valhalla && docker rm valhalla"
echo ""

