# Open Source Routing Engine Research

**Date:** 2025-01-27  
**Purpose:** Evaluate open-source routing engines for TravelBlogr's intelligent route planning

---

## 🎯 Current Implementation vs. Open Source Solutions

### **What We're Using Now:**

| Component | Technology | Limitations |
|-----------|-----------|-------------|
| **Routing API** | OSRM Demo Server | No scenic route support, basic alternatives only |
| **Waypoint Selection** | Custom Overpass API queries | Manual implementation, not optimized |
| **Border Prevention** | Custom Overpass API country check | Slow, requires multiple API calls |
| **POI Discovery** | OpenTripMap + Overpass | Fragmented, not integrated with routing |

### **Problems with Current Approach:**

1. ❌ **No native scenic route support** - We're hacking waypoints into OSRM
2. ❌ **Border crossing prevention is slow** - Multiple API calls per waypoint
3. ❌ **No route optimization** - Can't balance scenic value vs. distance
4. ❌ **Limited customization** - Can't adjust routing preferences dynamically
5. ❌ **No multi-criteria routing** - Can't optimize for multiple factors (scenic + POI + distance)

---

## 🚀 Top Open Source Routing Engines

### **1. Valhalla** ⭐⭐⭐⭐⭐ (RECOMMENDED)

**GitHub:** https://github.com/valhalla/valhalla  
**License:** MIT  
**Language:** C++  
**Maintained:** ✅ Active (Mapbox, Stadia Maps)

#### **Why Valhalla is Perfect for TravelBlogr:**

✅ **Built-in scenic routing:**
- `use_trails` parameter for cycling routes
- `use_ferry` parameter for water routes
- `use_highways` parameter (set to 0 for scenic routes)
- `shortest` parameter (set to false for scenic routes)

✅ **Advanced costing models:**
```json
{
  "costing": "auto",
  "costing_options": {
    "auto": {
      "use_highways": 0.1,  // Avoid highways (scenic!)
      "use_tolls": 0.0,      // Avoid tolls
      "use_ferry": 1.0,      // Prefer ferries (scenic!)
      "shortest": false      // Prefer scenic over shortest
    }
  }
}
```

✅ **Border avoidance built-in:**
- `exclude_polygons` parameter - Define country boundaries
- No need for custom Overpass API calls!
- Fast, efficient, integrated

✅ **Multi-modal routing:**
- Auto, bicycle, pedestrian, motorcycle, transit
- Each mode has custom scenic parameters

✅ **Alternative routes:**
- Returns multiple route options
- Can request "scenic" vs "fastest" vs "shortest"

✅ **POI integration:**
- Can query POIs along route
- Supports custom waypoints with POI data

#### **Valhalla API Example:**

```bash
# Scenic route from Vancouver to Banff
curl https://valhalla-api.com/route \
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
    },
    "exclude_polygons": [
      [[...USA_BOUNDARY_COORDINATES...]]
    ],
    "alternates": 3
  }'
```

#### **Valhalla Deployment Options:**

1. **Self-hosted (Docker):**
   ```bash
   docker run -p 8002:8002 valhalla/valhalla:latest
   ```

2. **Hosted Services:**
   - **Stadia Maps:** Free tier 50,000 requests/month
   - **Mapbox:** Free tier 100,000 requests/month

#### **Valhalla Pros:**

- ✅ **Scenic routing built-in** - No custom waypoint hacking
- ✅ **Border avoidance native** - Fast, efficient
- ✅ **Multi-criteria optimization** - Balance scenic + distance + time
- ✅ **Active development** - Used by Mapbox, Stadia Maps
- ✅ **Excellent documentation** - Well-maintained
- ✅ **Free hosted options** - Stadia Maps, Mapbox

#### **Valhalla Cons:**

- ⚠️ **C++ codebase** - Harder to customize than JavaScript
- ⚠️ **Requires OSM data** - Need to download/process map data for self-hosting
- ⚠️ **Memory intensive** - Requires 8-16GB RAM for global routing

---

### **2. GraphHopper** ⭐⭐⭐⭐

**GitHub:** https://github.com/graphhopper/graphhopper  
**License:** Apache 2.0  
**Language:** Java  
**Maintained:** ✅ Active

#### **Why GraphHopper is Good:**

✅ **Custom routing models:**
```json
{
  "custom_model": {
    "priority": [
      {"if": "road_class == MOTORWAY", "multiply_by": 0.1},
      {"if": "road_class == SCENIC", "multiply_by": 2.0},
      {"if": "surface == unpaved", "multiply_by": 0.5}
    ]
  }
}
```

✅ **Alternative routes:**
- Built-in alternative route algorithm
- Can request multiple route options

✅ **Border avoidance:**
- `areas` parameter to exclude regions
- Custom model can penalize border crossings

✅ **Active community:**
- Large user base
- Good documentation

#### **GraphHopper Pros:**

- ✅ **Highly customizable** - Custom routing models
- ✅ **Java-based** - Easier to integrate with JVM apps
- ✅ **Good documentation** - Active community
- ✅ **Free hosted API** - GraphHopper Directions API

#### **GraphHopper Cons:**

- ⚠️ **No native scenic routing** - Need custom models
- ⚠️ **Slower than Valhalla** - Java overhead
- ⚠️ **Complex setup** - Requires Java environment

---

### **3. OSRM** ⭐⭐⭐

**GitHub:** https://github.com/Project-OSRM/osrm-backend  
**License:** BSD  
**Language:** C++  
**Maintained:** ✅ Active

#### **What We're Already Using:**

- ✅ **Fast routing** - Fastest open-source routing engine
- ✅ **Free demo server** - No API key required
- ✅ **Simple API** - Easy to use

#### **OSRM Limitations:**

- ❌ **No scenic routing** - Only fastest/shortest
- ❌ **No border avoidance** - No built-in support
- ❌ **Limited alternatives** - Usually returns 1-2 routes max
- ❌ **No customization** - Can't adjust routing preferences

**Verdict:** OSRM is great for "fastest" routes, but NOT suitable for scenic/longest routes.

---

## 📊 Comparison Matrix

| Feature | Valhalla | GraphHopper | OSRM (Current) |
|---------|----------|-------------|----------------|
| **Scenic Routing** | ✅ Native | ⚠️ Custom models | ❌ No |
| **Border Avoidance** | ✅ Native | ✅ Areas | ❌ No |
| **Alternative Routes** | ✅ 3+ routes | ✅ 2-3 routes | ⚠️ 1-2 routes |
| **Customization** | ✅ Costing options | ✅ Custom models | ❌ Limited |
| **Speed** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Memory Usage** | High (8-16GB) | Medium (4-8GB) | Low (2-4GB) |
| **Setup Complexity** | Medium | Medium | Easy |
| **Free Hosted API** | ✅ Stadia Maps | ✅ GraphHopper | ✅ Demo server |
| **Documentation** | ✅ Excellent | ✅ Good | ✅ Good |
| **Active Development** | ✅ Yes | ✅ Yes | ✅ Yes |

---

## 🎯 UPDATED Recommendation (100% FREE)

### **Analysis of ModernRoutePlanningStack-analysis.html:**

The HTML document confirms the key insight:

> **"The best practice is often a hybrid approach. Use commercial APIs for their rich, real-time data (like traffic and geocoding), but feed their output into your own system where you can apply custom business logic and advanced preferences (like scenic scoring) that APIs don't offer out-of-the-box."**

**Key Takeaways:**
1. ✅ **Scenic routes are a data-weighting problem** - Not magic, just layered data
2. ✅ **Open-source engines require operational overhead** - But give maximum control
3. ✅ **Commercial APIs offer ease of use** - But limited customization
4. ✅ **Hybrid approach is best** - Combine strengths of both

---

### **100% FREE Solution for TravelBlogr:**

Given your requirement that it **MUST BE FREE**, here's the revised recommendation:

#### **Option 1: Self-Hosted Valhalla (Docker) - RECOMMENDED** ⭐⭐⭐⭐⭐

**Official Docker Image:** `ghcr.io/valhalla/valhalla-scripted:latest`

**Why:**
- ✅ **100% FREE** - No API costs, no limits
- ✅ **Native scenic routing** - Built-in costing models
- ✅ **Border avoidance** - Native `exclude_polygons` support
- ✅ **Full control** - Customize everything
- ✅ **Easy deployment** - Official Docker container with scripts
- ✅ **Pre-built** - No compilation needed

**Quick Setup (5 Minutes):**
```bash
# 1. Pull official Valhalla Docker image
docker pull ghcr.io/valhalla/valhalla-scripted:latest

# 2. Download OSM data for your region
# Canada only (~5GB)
wget https://download.geofabrik.de/north-america/canada-latest.osm.pbf

# OR North America (~50GB)
# wget https://download.geofabrik.de/north-america-latest.osm.pbf

# 3. Run Valhalla with auto-build
docker run -d \
  --name valhalla \
  -p 8002:8002 \
  -v $PWD:/custom_files \
  ghcr.io/valhalla/valhalla-scripted:latest \
  /custom_files/canada-latest.osm.pbf

# 4. Wait for tiles to build (10-30 minutes for Canada)
docker logs -f valhalla

# 5. Test routing API
curl "http://localhost:8002/route" \
  --data '{
    "locations": [
      {"lat": 49.2827, "lon": -123.1207},
      {"lat": 51.1784, "lon": -115.5708}
    ],
    "costing": "auto",
    "costing_options": {
      "auto": {
        "use_highways": 0.1,
        "shortest": false
      }
    }
  }' | jq
```

**Deploy to Railway (1-Click):**
```bash
# 1. Create Dockerfile
cat > Dockerfile <<EOF
FROM ghcr.io/valhalla/valhalla-scripted:latest
COPY canada-latest.osm.pbf /data/
RUN valhalla_build_tiles -c /etc/valhalla.json /data/canada-latest.osm.pbf
CMD ["valhalla_service", "/etc/valhalla.json"]
EOF

# 2. Deploy to Railway
railway up
```

**Pros:**
- ✅ **FREE forever** - No API costs
- ✅ **Unlimited requests** - No rate limits
- ✅ **Full customization** - Modify costing models
- ✅ **Privacy** - No data sent to third parties
- ✅ **Official image** - Maintained by Valhalla team
- ✅ **Auto-build** - Tiles built automatically

**Cons:**
- ⚠️ **Requires server** - Railway, AWS, DigitalOcean ($5-10/month)
- ⚠️ **Storage needed** - 5-10GB for Canada, 50-100GB for North America
- ⚠️ **Initial build** - 10-30 minutes for Canada, 2-4 hours for North America
- ⚠️ **Maintenance** - Update OSM data monthly (optional)

---

#### **Option 2: OSRM + Custom Scenic Logic (Current + Enhanced) - FALLBACK** ⭐⭐⭐

**Why:**
- ✅ **100% FREE** - OSRM demo server + Overpass API
- ✅ **Already working** - Just enhance current implementation
- ✅ **No server needed** - Use free public APIs
- ✅ **Zero setup** - Works immediately

**Enhanced Implementation:**
```typescript
// Keep current approach but optimize it
if (preference === 'fastest') {
  return await getOSRMRoute(...)  // OSRM demo server
} else if (preference === 'scenic') {
  // Use optimized Overpass API queries
  const scenicWaypoints = await findScenicWaypoints(...)
  return await getOSRMRoute([start, ...scenicWaypoints, end])
} else if (preference === 'longest') {
  // Use OpenTripMap for POI density
  const poiWaypoints = await findPOIRichWaypoints(...)
  return await getOSRMRoute([start, ...poiWaypoints, end])
}
```

**Pros:**
- ✅ **100% FREE** - No costs at all
- ✅ **No server needed** - Use public APIs
- ✅ **Already implemented** - Just optimize
- ✅ **Zero maintenance** - No infrastructure

**Cons:**
- ⚠️ **Slower** - Multiple API calls for scenic routes
- ⚠️ **Less accurate** - Manual waypoint selection
- ⚠️ **Border crossing issues** - Requires Overpass API calls

---

### **FINAL RECOMMENDATION:**

**For TravelBlogr (100% FREE requirement):**

1. **Short-term (Now):** Keep OSRM + Enhanced Custom Logic (Option 2)
   - ✅ Works immediately
   - ✅ Zero cost
   - ✅ No infrastructure needed

2. **Long-term (When you have $5-10/month for server):** Self-Hosted Valhalla (Option 1)
   - ✅ Much better scenic routes
   - ✅ Faster, more accurate
   - ✅ Full control

**Why NOT Stadia Maps/Mapbox Free Tier:**
- ⚠️ **50k requests/month limit** - Could hit limit as you scale
- ⚠️ **Requires API key** - Dependency on third party
- ⚠️ **Terms of service** - Could change pricing anytime

**Why Self-Hosted Valhalla is Worth $5-10/month:**
- ✅ **Unlimited requests** - No limits ever
- ✅ **Better scenic routes** - Native costing models
- ✅ **Faster** - No external API calls
- ✅ **Full control** - Customize everything

---

## 🚀 Implementation Plan

### **Phase 1: Integrate Valhalla for Scenic Routes (Week 1)**

1. **Sign up for Stadia Maps free tier:**
   - 50,000 requests/month free
   - No credit card required
   - API key in 5 minutes

2. **Create Valhalla service wrapper:**
   ```typescript
   // apps/web/lib/services/valhallaService.ts
   export async function getValhallaRoute(
     start: RouteCoordinate,
     end: RouteCoordinate,
     preference: 'scenic' | 'longest'
   ): Promise<RouteResult> {
     const costingOptions = preference === 'scenic' ? {
       use_highways: 0.1,  // Avoid highways
       use_ferry: 1.0,     // Prefer ferries
       shortest: false     // Prefer scenic
     } : {
       use_highways: 0.5,  // Some highways OK
       use_ferry: 1.0,     // Prefer ferries
       shortest: false     // Prefer longer routes
     }
     
     const response = await fetch('https://api.stadiamaps.com/route/v1', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Stadia-Auth ${process.env.STADIA_API_KEY}`
       },
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
     
     return parseValhallaResponse(await response.json())
   }
   ```

3. **Update routing service:**
   ```typescript
   // apps/web/lib/services/routingService.ts
   if (preference === 'scenic' || preference === 'longest') {
     return await getValhallaRoute(coordinates[0], coordinates[coordinates.length - 1], preference)
   } else {
     return await getOSRMRoute(coordinates, profile) // Keep OSRM for fastest
   }
   ```

### **Phase 2: Add Border Avoidance (Week 2)**

1. **Create country boundary polygons:**
   - Download from Natural Earth Data
   - Store in database or static files
   - Pass to Valhalla `exclude_polygons` parameter

2. **Update Valhalla service:**
   ```typescript
   const countryBoundaries = await getCountryBoundaries(startCountry)
   const excludePolygons = getAllCountriesExcept(startCountry)
   
   // Add to Valhalla request
   body.exclude_polygons = excludePolygons
   ```

### **Phase 3: POI Integration (Week 3)**

1. **Query POIs along Valhalla route:**
   - Use route geometry to create bounding box
   - Query OpenTripMap/Overpass for POIs
   - Rank routes by POI density

2. **Multi-criteria scoring:**
   ```typescript
   const score = (
     scenicScore * 0.4 +
     poiScore * 0.3 +
     distanceScore * 0.3
   )
   ```

---

## 💰 Cost Analysis (100% FREE Options)

### **Option 1: Self-Hosted Valhalla**

**Infrastructure Cost:**
- **Railway Hobby Plan:** $5/month (512MB RAM, 1GB storage)
- **DigitalOcean Droplet:** $6/month (1GB RAM, 25GB SSD)
- **AWS EC2 t3.small:** ~$15/month (2GB RAM, 30GB storage)

**Storage Cost (OSM Data):**
- **North America:** ~50GB (includes USA, Canada, Mexico)
- **Europe:** ~30GB
- **Single country (e.g., Canada):** ~5-10GB

**Total Cost:** $5-15/month for unlimited routing requests

**Pros:**
- ✅ **Unlimited requests** - No API limits
- ✅ **Full control** - Customize everything
- ✅ **Privacy** - No data sent to third parties
- ✅ **Predictable cost** - Fixed monthly fee

**Cons:**
- ⚠️ **Not 100% free** - Requires server ($5-15/month)
- ⚠️ **Maintenance** - Update OSM data monthly
- ⚠️ **Setup time** - 2-4 hours initial setup

---

### **Option 2: OSRM Demo + Overpass API (Current)**

**API Costs:**
- **OSRM Demo Server:** FREE (unlimited, fair use)
- **Overpass API:** FREE (unlimited, fair use)
- **OpenTripMap API:** FREE (5,000 requests/day)

**Total Cost:** $0/month

**Pros:**
- ✅ **100% FREE** - No costs at all
- ✅ **No infrastructure** - Use public APIs
- ✅ **Zero maintenance** - No servers to manage
- ✅ **Works now** - Already implemented

**Cons:**
- ⚠️ **Slower** - Multiple API calls for scenic routes
- ⚠️ **Less accurate** - Manual waypoint selection
- ⚠️ **Dependent on public APIs** - Could go down or change

---

### **Option 3: Stadia Maps Free Tier (NOT RECOMMENDED)**

**API Costs:**
- **Free Tier:** 50,000 requests/month
- **Overage:** $0.50 per 1,000 requests

**Estimated Usage:**
- 100 users/day × 3 routes = 300 requests/day
- 300 × 30 = 9,000 requests/month
- **Within free tier** ✅

**Why NOT Recommended:**
- ⚠️ **Scaling risk** - Could hit 50k limit as you grow
- ⚠️ **Dependency** - Reliant on third-party service
- ⚠️ **Terms changes** - Pricing could change anytime
- ⚠️ **Not truly free** - Requires credit card for overage

---

## 📚 Resources

### **Valhalla:**
- **Docs:** https://valhalla.github.io/valhalla/
- **API Reference:** https://valhalla.github.io/valhalla/api/turn-by-turn/api-reference/
- **Stadia Maps:** https://stadiamaps.com/
- **GitHub:** https://github.com/valhalla/valhalla

### **GraphHopper:**
- **Docs:** https://docs.graphhopper.com/
- **GitHub:** https://github.com/graphhopper/graphhopper

### **OSRM:**
- **Docs:** http://project-osrm.org/
- **GitHub:** https://github.com/Project-OSRM/osrm-backend

---

## ✅ Next Steps

1. **Sign up for Stadia Maps free tier** (5 minutes)
2. **Implement Valhalla service wrapper** (2 hours)
3. **Test scenic routes** (Vancouver → Banff, Paris → Nice, etc.)
4. **Compare results with current implementation**
5. **Deploy to production** (if results are better)

---

**Conclusion:** Valhalla is the clear winner for TravelBlogr's scenic and longest route needs. It provides native scenic routing, border avoidance, and multi-criteria optimization - all features we're currently hacking together with custom code. The free tier from Stadia Maps is more than sufficient for our needs.

