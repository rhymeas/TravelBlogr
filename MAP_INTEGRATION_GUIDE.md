# 🗺️ Map Integration Guide - Free & Professional

## 🎯 Current Implementation Status

### **✅ Already Integrated (Working Now):**
1. **OpenStreetMap Overpass** - Restaurants, cafes, activities
2. **OpenTripMap** - Tourist attractions, museums, monuments
3. **WikiVoyage** - Travel guides and descriptions
4. **Wikipedia** - Rich descriptions and images
5. **Wikimedia Commons** - Free images
6. **Open-Meteo** - Weather forecasts
7. **GeoNames** - Location metadata (optional)

### **🗺️ Next: Map Visualization**
Add interactive maps to display all this data beautifully!

---

## 🗺️ Recommended: MapLibre GL + CARTO

### **Why This Combo?**
- ✅ **100% Free** - No API keys, no limits
- ✅ **Mapbox Quality** - Professional appearance
- ✅ **Fast Performance** - WebGL rendering
- ✅ **React Integration** - react-map-gl wrapper
- ✅ **Customizable** - Multiple themes (light/dark/colorful)

---

## 📦 Installation

### **Step 1: Install Dependencies**
```bash
cd apps/web
npm install maplibre-gl react-map-gl
```

### **Step 2: Add CSS**
Add to `apps/web/app/globals.css`:
```css
/* MapLibre GL styles */
@import 'maplibre-gl/dist/maplibre-gl.css';
```

---

## 🎨 Map Component Implementation

### **Basic Map Component:**
```typescript
// apps/web/components/maps/LocationMap.tsx
'use client'

import { useState } from 'react'
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'

interface LocationMapProps {
  latitude: number
  longitude: number
  markers?: Array<{
    id: string
    name: string
    latitude: number
    longitude: number
    type: 'restaurant' | 'activity' | 'attraction'
  }>
}

export function LocationMap({ latitude, longitude, markers = [] }: LocationMapProps) {
  const [popupInfo, setPopupInfo] = useState<any>(null)

  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden">
      <Map
        initialViewState={{
          latitude,
          longitude,
          zoom: 13
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
      >
        {/* Navigation Controls */}
        <NavigationControl position="top-right" />

        {/* Main Location Marker */}
        <Marker
          latitude={latitude}
          longitude={longitude}
          anchor="bottom"
        >
          <div className="text-4xl">📍</div>
        </Marker>

        {/* POI Markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            latitude={marker.latitude}
            longitude={marker.longitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              setPopupInfo(marker)
            }}
          >
            <div className="text-2xl cursor-pointer hover:scale-110 transition-transform">
              {marker.type === 'restaurant' && '🍽️'}
              {marker.type === 'activity' && '🎯'}
              {marker.type === 'attraction' && '🏛️'}
            </div>
          </Marker>
        ))}

        {/* Popup */}
        {popupInfo && (
          <Popup
            latitude={popupInfo.latitude}
            longitude={popupInfo.longitude}
            anchor="top"
            onClose={() => setPopupInfo(null)}
          >
            <div className="p-2">
              <h3 className="font-semibold">{popupInfo.name}</h3>
              <p className="text-sm text-gray-600">{popupInfo.type}</p>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  )
}
```

---

## 🎨 Available Map Styles (CARTO - Free)

### **1. Voyager (Recommended)**
```typescript
mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
```
- Colorful, modern design
- Great for travel apps
- Clear labels

### **2. Positron (Light)**
```typescript
mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
```
- Clean, minimal
- Light background
- Professional look

### **3. Dark Matter (Dark)**
```typescript
mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
```
- Dark theme
- Modern aesthetic
- Great for night mode

---

## 🎯 Integration with Existing Data

### **Update Location Detail Page:**
```typescript
// apps/web/app/locations/[slug]/page.tsx
import { LocationMap } from '@/components/maps/LocationMap'

export default async function LocationPage({ params }: LocationPageProps) {
  const location = await getLocationBySlug(params.slug)
  
  // Prepare markers from restaurants and activities
  const markers = [
    ...location.restaurants.slice(0, 20).map(r => ({
      id: r.id,
      name: r.name,
      latitude: r.latitude,
      longitude: r.longitude,
      type: 'restaurant' as const
    })),
    ...location.activities.slice(0, 20).map(a => ({
      id: a.id,
      name: a.name,
      latitude: a.latitude,
      longitude: a.longitude,
      type: 'activity' as const
    }))
  ]

  return (
    <div>
      {/* Existing content */}
      
      {/* Add Map Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 mb-12">
        <h2 className="text-2xl font-bold mb-6">Explore on Map</h2>
        <LocationMap
          latitude={location.latitude}
          longitude={location.longitude}
          markers={markers}
        />
      </section>
      
      {/* Rest of content */}
    </div>
  )
}
```

---

## 🎨 Advanced Features

### **1. Marker Clustering (for many POIs):**
```bash
npm install supercluster
```

### **2. Custom Marker Icons:**
```typescript
<Marker latitude={lat} longitude={lng}>
  <div className="relative">
    <div className="absolute -top-10 -left-5 bg-white rounded-full p-2 shadow-lg">
      <Image src="/icons/restaurant.svg" width={24} height={24} alt="Restaurant" />
    </div>
  </div>
</Marker>
```

### **3. Heatmap Layer:**
```typescript
import { Layer, Source } from 'react-map-gl/maplibre'

<Source
  type="geojson"
  data={{
    type: 'FeatureCollection',
    features: markers.map(m => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [m.longitude, m.latitude] }
    }))
  }}
>
  <Layer
    type="heatmap"
    paint={{
      'heatmap-weight': 1,
      'heatmap-intensity': 1,
      'heatmap-radius': 20
    }}
  />
</Source>
```

---

## 🚀 Alternative Options

### **Option 1: React Leaflet (Lightweight)**
```bash
npm install react-leaflet leaflet
```
- Simpler API
- Smaller bundle size
- Good for basic maps

### **Option 2: Pigeon Maps (Ultra Lightweight)**
```bash
npm install pigeon-maps
```
- Tiny bundle (3KB)
- No dependencies
- Basic features only

### **Option 3: Mapbox (Free Tier)**
```bash
npm install react-map-gl mapbox-gl
```
- 50,000 free loads/month
- Requires API key
- Premium features

---

## 📊 Data Structure for Maps

### **Location with Map Data:**
```typescript
interface LocationWithMap {
  id: string
  name: string
  latitude: number
  longitude: number
  
  // POIs for map markers
  restaurants: Array<{
    id: string
    name: string
    latitude: number
    longitude: number
    cuisine: string
  }>
  
  activities: Array<{
    id: string
    name: string
    latitude: number
    longitude: number
    category: string
  }>
  
  attractions: Array<{
    id: string
    name: string
    latitude: number
    longitude: number
    type: string
  }>
}
```

---

## 🎯 Implementation Priority

### **Phase 1: Basic Map (30 minutes)**
1. Install MapLibre GL + react-map-gl
2. Create LocationMap component
3. Add to location detail page
4. Show main location marker

### **Phase 2: POI Markers (30 minutes)**
1. Add restaurant markers
2. Add activity markers
3. Add attraction markers
4. Implement popups

### **Phase 3: Enhancements (1 hour)**
1. Add marker clustering
2. Custom marker icons
3. Filter by type
4. Search on map

---

## 💰 Cost Comparison

| Solution | Free Tier | Bundle Size | Quality | Setup Time |
|----------|-----------|-------------|---------|------------|
| **MapLibre + CARTO** | Unlimited | ~200KB | ⭐⭐⭐⭐⭐ | 30 min |
| **React Leaflet** | Unlimited | ~150KB | ⭐⭐⭐⭐ | 20 min |
| **Pigeon Maps** | Unlimited | ~3KB | ⭐⭐⭐ | 10 min |
| **Mapbox** | 50k loads/month | ~200KB | ⭐⭐⭐⭐⭐ | 30 min |

**Recommendation:** MapLibre + CARTO (best quality, completely free)

---

## 🎨 Example: Complete Map Section

```typescript
// apps/web/components/locations/LocationMapSection.tsx
'use client'

import { useState } from 'react'
import { LocationMap } from '@/components/maps/LocationMap'
import { Button } from '@/components/ui/Button'

interface LocationMapSectionProps {
  location: Location
}

export function LocationMapSection({ location }: LocationMapSectionProps) {
  const [filter, setFilter] = useState<'all' | 'restaurants' | 'activities'>('all')

  const markers = [
    ...(filter === 'all' || filter === 'restaurants' 
      ? location.restaurants.map(r => ({
          id: r.id,
          name: r.name,
          latitude: r.latitude,
          longitude: r.longitude,
          type: 'restaurant' as const
        }))
      : []),
    ...(filter === 'all' || filter === 'activities'
      ? location.activities.map(a => ({
          id: a.id,
          name: a.name,
          latitude: a.latitude,
          longitude: a.longitude,
          type: 'activity' as const
        }))
      : [])
  ]

  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-8 mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Explore on Map</h2>
        
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'restaurants' ? 'primary' : 'outline'}
            onClick={() => setFilter('restaurants')}
          >
            🍽️ Restaurants
          </Button>
          <Button
            variant={filter === 'activities' ? 'primary' : 'outline'}
            onClick={() => setFilter('activities')}
          >
            🎯 Activities
          </Button>
        </div>
      </div>

      <LocationMap
        latitude={location.latitude}
        longitude={location.longitude}
        markers={markers}
      />
      
      <p className="text-sm text-gray-600 mt-4">
        Showing {markers.length} locations on map
      </p>
    </section>
  )
}
```

---

## ✅ Summary

### **What You Get:**
- ✅ Professional interactive maps
- ✅ 100% free (no API keys)
- ✅ Unlimited usage
- ✅ Multiple themes
- ✅ Markers for all POIs
- ✅ Popups with details
- ✅ Navigation controls
- ✅ Mobile-friendly

### **Next Steps:**
1. Install MapLibre GL + react-map-gl (5 min)
2. Create LocationMap component (15 min)
3. Add to location detail page (10 min)
4. Test with existing data (5 min)

**Total Time:** 35 minutes
**Cost:** $0.00
**Result:** Professional travel app with interactive maps! 🗺️

