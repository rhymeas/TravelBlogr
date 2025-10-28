#!/bin/bash

# Check if Valhalla API is ready
echo "🔍 Checking Valhalla status..."

# Try to connect to the API
if curl -s http://localhost:8002/status > /dev/null 2>&1; then
    echo "✅ Valhalla API is ready!"
    echo ""
    echo "🧪 Testing with Vancouver → Banff route..."
    
    # Test route
    curl -s "http://localhost:8002/route" \
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
            "shortest": false
          }
        }
      }' | jq -r '.trip.summary | "Distance: \(.length)km, Duration: \(.time/60)min"'
    
    echo ""
    echo "✅ Ready to test at http://localhost:3000/test/route-strategies"
else
    echo "⏳ Valhalla is still building tiles..."
    echo ""
    echo "📊 Recent logs:"
    docker logs valhalla | tail -5
    echo ""
    echo "Run this script again in a few minutes to check status."
fi

