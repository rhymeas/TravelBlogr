#!/bin/bash

echo "⏳ Waiting for Valhalla to finish building tiles..."
echo "   This typically takes 10-30 minutes for Canada OSM data"
echo ""

MAX_WAIT=1800  # 30 minutes
ELAPSED=0
CHECK_INTERVAL=30  # Check every 30 seconds

while [ $ELAPSED -lt $MAX_WAIT ]; do
    if curl -s http://localhost:8002/status > /dev/null 2>&1; then
        echo ""
        echo "✅ Valhalla service is ready!"
        echo ""
        echo "🧪 Testing with Vancouver → Banff scenic route..."
        
        # Test scenic route
        RESPONSE=$(curl -s "http://localhost:8002/route" \
          -H "Content-Type: application/json" \
          -d '{
            "locations": [
              {"lat": 49.2827, "lon": -123.1207},
              {"lat": 51.1784, "lon": -115.5708}
            ],
            "costing": "auto",
            "costing_options": {
              "auto": {
                "use_highways": 0.1,
                "use_tolls": 0.0,
                "use_ferry": 1.0,
                "shortest": false,
                "use_living_streets": 0.7
              }
            }
          }')
        
        if echo "$RESPONSE" | grep -q "trip"; then
            echo "✅ Scenic route test successful!"
            echo ""
            echo "$RESPONSE" | jq -r '.trip.summary | "📍 Distance: \(.length)km\n⏱️  Duration: \(.time/60 | floor)min"'
            echo ""
            echo "🎉 Ready to test at: http://localhost:3000/test/route-strategies"
            exit 0
        else
            echo "⚠️  API responded but route failed. Response:"
            echo "$RESPONSE" | jq '.'
            exit 1
        fi
    fi
    
    # Show progress
    MINUTES=$((ELAPSED / 60))
    echo "⏳ Still building... ($MINUTES minutes elapsed)"
    
    # Show last log line
    LAST_LOG=$(docker logs valhalla 2>&1 | tail -1)
    echo "   Latest: $LAST_LOG"
    
    sleep $CHECK_INTERVAL
    ELAPSED=$((ELAPSED + CHECK_INTERVAL))
done

echo ""
echo "❌ Timeout: Valhalla did not start within 30 minutes"
echo "   Check logs with: docker logs valhalla"
exit 1

