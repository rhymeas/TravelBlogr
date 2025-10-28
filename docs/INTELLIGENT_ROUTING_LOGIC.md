# Intelligent Routing Logic

## Overview

TravelBlogr uses **distance-aware routing strategies** to provide the best scenic and longest routes based on the actual distance between start and end points.

Instead of using hardcoded routing parameters, the system **adapts its strategy** based on route characteristics.

---

## Route Types

### 1. **Fastest Route** (OSRM)
- **Goal:** Minimize travel time
- **Strategy:** Use highways, toll roads, direct path
- **Provider:** OSRM Demo Server
- **Use case:** Quick travel, business trips

### 2. **Scenic Route** (Valhalla)
- **Goal:** Maximize scenic value while remaining practical
- **Strategy:** Distance-aware scenic optimization
- **Provider:** Self-hosted Valhalla
- **Use case:** Leisure travel, sightseeing

### 3. **Longest Route** (Valhalla)
- **Goal:** Maximize distance through POI-rich areas
- **Strategy:** Distance-aware detour optimization
- **Provider:** Self-hosted Valhalla
- **Use case:** Road trips, exploration

---

## Intelligent Scenic Route Logic

### Short Routes (<100km)
**Strategy:** Maximize scenic value

```typescript
{
  use_highways: 0.0,        // NO highways
  use_tolls: 0.0,           // NO tolls
  use_ferry: 1.0,           // Prefer ferries (scenic!)
  use_living_streets: 0.9,  // Strongly prefer residential/scenic
  maneuver_penalty: 3       // Very low penalty (allow many turns)
}
```

**Example:** Vancouver to Squamish (60km)
- **Avoid:** Highway 99 (Sea-to-Sky Highway)
- **Prefer:** Coastal roads, residential streets, scenic viewpoints
- **Result:** ~80-100km route through scenic areas

---

### Medium Routes (100-500km)
**Strategy:** Balance scenic + practicality

```typescript
{
  use_highways: 0.2,        // Minimal highways
  use_tolls: 0.0,           // Avoid tolls
  use_ferry: 1.0,           // Prefer ferries
  use_living_streets: 0.7,  // Prefer scenic roads
  maneuver_penalty: 5       // Low penalty
}
```

**Example:** Vancouver to Kelowna (400km)
- **Avoid:** Most highways, but allow some for practicality
- **Prefer:** Scenic corridors (Okanagan Valley, mountain passes)
- **Result:** ~450-550km route through scenic areas

---

### Long Routes (>500km)
**Strategy:** Scenic corridors with highway connections

```typescript
{
  use_highways: 0.4,        // Some highways OK for long distances
  use_tolls: 0.1,           // Minimal tolls
  use_ferry: 1.0,           // Prefer ferries
  use_living_streets: 0.6,  // Moderate scenic preference
  maneuver_penalty: 7       // Moderate penalty
}
```

**Example:** Vancouver to Banff (850km)
- **Allow:** Highways between scenic areas (practical for long distances)
- **Prefer:** Scenic corridors (Whistler, Clearwater, Jasper)
- **Result:** ~1,150-1,300km route through major scenic areas

---

## Intelligent Longest Route Logic

### Short Routes (<100km)
**Strategy:** Maximize detours through towns

```typescript
{
  use_highways: 0.0,        // NO highways (forces detours)
  use_tolls: 0.0,           // NO tolls
  use_ferry: 1.0,           // Prefer ferries
  use_tracks: 0.3,          // Some unpaved OK (adds distance)
  use_living_streets: 1.0,  // Maximize residential (more POIs)
  maneuver_penalty: 1       // Minimal penalty (encourage turns)
}
```

**Example:** Vancouver to Squamish (60km)
- **Strategy:** Route through every town, neighborhood, POI
- **Result:** ~120-150km route through Horseshoe Bay, Lions Bay, Britannia Beach

---

### Medium Routes (100-500km)
**Strategy:** Route through multiple towns/regions

```typescript
{
  use_highways: 0.3,        // Some highways OK
  use_tolls: 0.2,           // Some tolls OK
  use_ferry: 1.0,           // Prefer ferries
  use_tracks: 0.2,          // Some unpaved OK
  use_living_streets: 0.8,  // Prefer residential
  maneuver_penalty: 3       // Low penalty
}
```

**Example:** Vancouver to Kelowna (400km)
- **Strategy:** Route through Whistler, Pemberton, Lillooet, Kamloops
- **Result:** ~600-800km route through multiple towns

---

### Long Routes (>500km)
**Strategy:** Grand tour through major POIs

```typescript
{
  use_highways: 0.5,        // Highways OK between POIs
  use_tolls: 0.3,           // Tolls OK
  use_ferry: 1.0,           // Prefer ferries
  use_tracks: 0.1,          // Minimal unpaved
  use_living_streets: 0.7,  // Moderate residential preference
  maneuver_penalty: 5       // Moderate penalty
}
```

**Example:** Vancouver to Banff (850km)
- **Strategy:** Grand tour through Whistler, Kamloops, Jasper, Lake Louise
- **Result:** ~1,400-1,600km route through major POIs

---

## Valhalla Costing Parameters Explained

### Highway Usage (`use_highways`)
- **0.0:** Never use highways (forces scenic/local roads)
- **0.5:** Neutral (use highways when practical)
- **1.0:** Prefer highways (fastest route)

### Living Streets (`use_living_streets`)
- **0.0:** Avoid residential streets
- **0.5:** Neutral
- **1.0:** Prefer residential streets (more scenic, more POIs)

### Maneuver Penalty
- **Low (1-3):** Encourage turns (allows detours, scenic routes)
- **Medium (5-7):** Moderate turns
- **High (10+):** Discourage turns (prefer straight routes)

### Ferry Usage (`use_ferry`)
- **0.0:** Avoid ferries
- **1.0:** Prefer ferries (scenic, unique experience)

### Country Crossing Cost
- **600:** High cost to prevent border crossings
- **0:** Allow border crossings if necessary

---

## Alternative Route Selection (Scenic Only)

For scenic routes, Valhalla returns **3 alternative routes**:

1. **Fastest alternative** (shortest distance)
2. **Scenic alternative** (medium distance) ← **We pick this one**
3. **Longest alternative** (maximum distance)

**Why pick the middle route?**
- Too short = Not scenic enough
- Too long = Impractical
- **Middle route = Sweet spot for scenic value + practicality**

---

## Testing the Logic

### Test Different Distances

**Short Route (60km):**
```
Vancouver (49.2827, -123.1207) → Squamish (49.7016, -123.1558)
```

**Medium Route (400km):**
```
Vancouver (49.2827, -123.1207) → Kelowna (49.8880, -119.4960)
```

**Long Route (850km):**
```
Vancouver (49.2827, -123.1207) → Banff (51.1784, -115.5708)
```

### Expected Results

| Route | Fastest (OSRM) | Scenic (Valhalla) | Longest (Valhalla) |
|-------|----------------|-------------------|-------------------|
| **Short (60km)** | ~60km, 1h | ~80-100km, 1.5h | ~120-150km, 2h |
| **Medium (400km)** | ~400km, 5h | ~450-550km, 6-7h | ~600-800km, 8-10h |
| **Long (850km)** | ~850km, 11h | ~1,150-1,300km, 17-19h | ~1,400-1,600km, 23-25h |

---

## Implementation Details

### Distance Calculation

Uses **Haversine formula** for great circle distance:

```typescript
function calculateRouteDistance(start: RouteCoordinate, end: RouteCoordinate): number {
  const R = 6371 // Earth's radius in km
  const dLat = (end.latitude - start.latitude) * Math.PI / 180
  const dLon = (end.longitude - start.longitude) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(start.latitude * Math.PI / 180) * Math.cos(end.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
```

### Fallback Strategy

If Valhalla is unavailable, the system falls back to:

1. **OSRM + POI waypoints** (for longest routes)
2. **OSRM + scenic waypoints** (for scenic routes)
3. **OSRM alternatives** (basic fallback)

---

## Future Enhancements

### 1. **POI-Based Waypoints for Longest Routes**
- Fetch POIs along the route corridor
- Add waypoints to force routing through POI-rich areas
- Example: Vancouver → Banff via Whistler, Kamloops, Jasper

### 2. **Terrain-Aware Scenic Routing**
- Use elevation data to prefer mountain passes, coastal roads
- Avoid flat, boring highways

### 3. **User Preferences**
- Allow users to customize scenic/longest preferences
- Example: "I want a scenic route but max 20% longer than fastest"

### 4. **Time-of-Day Routing**
- Prefer sunset routes for evening travel
- Avoid rush hour in cities

---

## References

- **Valhalla Documentation:** https://valhalla.github.io/valhalla/
- **Valhalla Costing Options:** https://valhalla.github.io/valhalla/api/turn-by-turn/api-reference/
- **OSRM Documentation:** http://project-osrm.org/docs/v5.24.0/api/

