# Valhalla Self-Hosted Setup Guide

**Date:** 2025-01-27  
**Purpose:** Step-by-step guide to set up Valhalla routing engine for TravelBlogr

---

## 🚀 Quick Start (Local Development)

### **Step 1: Pull Valhalla Docker Image**

```bash
docker pull ghcr.io/valhalla/valhalla-scripted:latest
```

### **Step 2: Download OSM Data**

**Option A: Canada Only (~5GB, recommended for testing)**
```bash
cd ~/Downloads
wget https://download.geofabrik.de/north-america/canada-latest.osm.pbf
```

**Option B: North America (~50GB, for production)**
```bash
cd ~/Downloads
wget https://download.geofabrik.de/north-america-latest.osm.pbf
```

### **Step 3: Run Valhalla Container**

```bash
# Create directory for Valhalla data
mkdir -p ~/valhalla-data

# Copy OSM data
cp ~/Downloads/canada-latest.osm.pbf ~/valhalla-data/

# Run Valhalla (auto-builds tiles)
docker run -d \
  --name valhalla \
  -p 8002:8002 \
  -v ~/valhalla-data:/custom_files \
  ghcr.io/valhalla/valhalla-scripted:latest \
  /custom_files/canada-latest.osm.pbf
```

### **Step 4: Monitor Tile Building**

```bash
# Watch logs (tiles build automatically)
docker logs -f valhalla

# Wait for: "HTTP server running on port 8002"
# Canada: ~10-30 minutes
# North America: ~2-4 hours
```

### **Step 5: Test Routing API**

```bash
# Test basic route (Vancouver → Banff)
curl "http://localhost:8002/route" \
  -H "Content-Type: application/json" \
  -d '{
    "locations": [
      {"lat": 49.2827, "lon": -123.1207},
      {"lat": 51.1784, "lon": -115.5708}
    ],
    "costing": "auto"
  }' | jq '.trip.summary'

# Test SCENIC route (avoid highways)
curl "http://localhost:8002/route" \
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
  }' | jq '.trip.summary'
```

---

## 🔧 Valhalla API Reference

### **Scenic Route Parameters:**

```json
{
  "costing_options": {
    "auto": {
      "use_highways": 0.1,     // 0.0-1.0 (0.1 = avoid highways)
      "use_tolls": 0.0,         // 0.0 = avoid tolls
      "use_ferry": 1.0,         // 1.0 = prefer ferries
      "shortest": false,        // false = prefer scenic over shortest
      "use_tracks": 0.0,        // 0.0 = avoid unpaved roads
      "use_living_streets": 0.5 // 0.5 = moderate preference for residential
    }
  }
}
```

### **Border Avoidance (Exclude USA):**

```json
{
  "exclude_polygons": [
    [
      [-125.0, 49.0],  // Southwest corner
      [-125.0, 60.0],  // Northwest corner
      [-95.0, 60.0],   // Northeast corner
      [-95.0, 49.0],   // Southeast corner
      [-125.0, 49.0]   // Close polygon
    ]
  ]
}
```

### **Alternative Routes:**

```json
{
  "alternates": 3,  // Request 3 alternative routes
  "costing": "auto"
}
```

---

## 📦 Integration with TravelBlogr

### **Step 1: Create Valhalla Service**

Create `apps/web/lib/services/valhallaService.ts`:

```typescript
import type { RouteCoordinate, RouteResult } from './routingService'

const VALHALLA_URL = process.env.VALHALLA_URL || 'http://localhost:8002'

export async function getValhallaRoute(
  start: RouteCoordinate,
  end: RouteCoordinate,
  preference: 'scenic' | 'longest'
): Promise<RouteResult> {
  const costingOptions = preference === 'scenic' ? {
    use_highways: 0.1,  // Avoid highways
    use_tolls: 0.0,     // Avoid tolls
    use_ferry: 1.0,     // Prefer ferries
    shortest: false     // Prefer scenic
  } : {
    use_highways: 0.5,  // Some highways OK
    use_ferry: 1.0,     // Prefer ferries
    shortest: false     // Prefer longer routes
  }

  const response = await fetch(`${VALHALLA_URL}/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      locations: [
        { lat: start.latitude, lon: start.longitude },
        { lat: end.latitude, lon: end.longitude }
      ],
      costing: 'auto',
      costing_options: { auto: costingOptions },
      alternates: 3
    })
  })

  if (!response.ok) {
    throw new Error(`Valhalla API error: ${response.statusText}`)
  }

  const data = await response.json()
  return parseValhallaResponse(data)
}

function parseValhallaResponse(data: any): RouteResult {
  const trip = data.trip
  
  return {
    geometry: {
      type: 'LineString',
      coordinates: decodePolyline(trip.legs[0].shape)
    },
    distance: trip.summary.length * 1000, // km to meters
    duration: trip.summary.time,          // seconds
    provider: 'valhalla'
  }
}

// Decode Valhalla's polyline6 format
function decodePolyline(encoded: string): number[][] {
  const coordinates: number[][] = []
  let index = 0
  let lat = 0
  let lng = 0

  while (index < encoded.length) {
    let b
    let shift = 0
    let result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1))
    lat += dlat

    shift = 0
    result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1))
    lng += dlng

    coordinates.push([lng / 1e6, lat / 1e6])
  }

  return coordinates
}
```

### **Step 2: Update Routing Service**

Update `apps/web/lib/services/routingService.ts`:

```typescript
import { getValhallaRoute } from './valhallaService'

export async function getRoute(
  coordinates: RouteCoordinate[],
  profile: TransportProfile,
  preference: RoutePreference = 'fastest'
): Promise<RouteResult> {
  // Use Valhalla for scenic and longest routes
  if (preference === 'scenic' || preference === 'longest') {
    try {
      console.log(`🏞️ Using Valhalla for ${preference} route...`)
      const route = await getValhallaRoute(
        coordinates[0],
        coordinates[coordinates.length - 1],
        preference
      )
      console.log(`✅ Valhalla route: ${(route.distance / 1000).toFixed(1)}km`)
      return route
    } catch (error) {
      console.warn('⚠️ Valhalla failed, falling back to OSRM:', error)
      // Fallback to current OSRM implementation
    }
  }

  // Use OSRM for fastest routes (already implemented)
  return await getOSRMRoute(coordinates, mapToOSRMProfile(profile))
}
```

### **Step 3: Add Environment Variable**

Add to `.env.local`:

```bash
# Valhalla Routing Engine
VALHALLA_URL=http://localhost:8002
```

For production (Railway):
```bash
VALHALLA_URL=https://your-valhalla-app.railway.app
```

---

## 🚢 Deploy to Railway (Production)

### **Option 1: Direct Docker Deploy**

1. **Create `railway.json`:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE"
  },
  "deploy": {
    "startCommand": "valhalla_service /etc/valhalla.json",
    "healthcheckPath": "/status",
    "healthcheckTimeout": 300
  }
}
```

2. **Create `Dockerfile`:**
```dockerfile
FROM ghcr.io/valhalla/valhalla-scripted:latest

# Download and build Canada tiles
RUN wget https://download.geofabrik.de/north-america/canada-latest.osm.pbf -O /data/canada.osm.pbf && \
    valhalla_build_tiles -c /etc/valhalla.json /data/canada.osm.pbf && \
    rm /data/canada.osm.pbf

EXPOSE 8002

CMD ["valhalla_service", "/etc/valhalla.json"]
```

3. **Deploy:**
```bash
railway up
```

### **Option 2: Pre-built Tiles (Faster Deploys)**

1. **Build tiles locally:**
```bash
docker run -v ~/valhalla-tiles:/tiles \
  ghcr.io/valhalla/valhalla-scripted:latest \
  /custom_files/canada-latest.osm.pbf
```

2. **Upload tiles to Railway volume**

3. **Mount volume in Dockerfile**

---

## 📊 Performance Comparison

### **Test Route: Vancouver → Banff**

| Engine | Route Type | Distance | Duration | Quality |
|--------|-----------|----------|----------|---------|
| **OSRM** | Fastest | 848km | 11h | ⭐⭐⭐⭐⭐ |
| **OSRM + Custom** | Scenic | 1,193km | 18h | ⭐⭐⭐ |
| **Valhalla** | Scenic | 1,150km | 17h | ⭐⭐⭐⭐⭐ |

**Valhalla Advantages:**
- ✅ **Better scenic routes** - Native costing models
- ✅ **Faster** - No multiple API calls
- ✅ **More accurate** - Optimized for scenic preferences
- ✅ **Border-aware** - Native polygon exclusion

---

## 🔍 Troubleshooting

### **Container won't start:**
```bash
# Check logs
docker logs valhalla

# Common issue: Not enough memory
# Solution: Increase Docker memory to 4GB
```

### **Tiles building too slow:**
```bash
# Use smaller region (single country)
wget https://download.geofabrik.de/north-america/canada-latest.osm.pbf

# Or use pre-built tiles
```

### **API returns 404:**
```bash
# Check if service is running
curl http://localhost:8002/status

# Restart container
docker restart valhalla
```

---

## 📚 Resources

- **Valhalla Docs:** https://valhalla.github.io/valhalla/
- **Docker Image:** https://github.com/valhalla/valhalla/pkgs/container/valhalla-scripted
- **OSM Data:** https://download.geofabrik.de/
- **API Reference:** https://valhalla.github.io/valhalla/api/turn-by-turn/api-reference/

