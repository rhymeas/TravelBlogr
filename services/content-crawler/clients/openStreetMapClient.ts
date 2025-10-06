/**
 * OpenStreetMap (Overpass API) Client
 * 100% FREE - No API key needed, unlimited requests
 *
 * Gets restaurants, attractions, activities from OpenStreetMap
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface GeocodingResult {
  lat: string
  lon: string
  display_name: string
  address: {
    country?: string
    state?: string
    city?: string
  }
}

/**
 * Geocode location name to coordinates using Nominatim (FREE)
 * No API key needed!
 */
export async function geocodeLocation(locationName: string): Promise<{
  latitude: number
  longitude: number
  country: string
  region: string
  fullName: string
} | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'TravelBlogr/1.0' // Required by Nominatim
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.statusText}`)
    }

    const data: GeocodingResult[] = await response.json()

    if (data.length === 0) {
      console.warn(`No results found for: ${locationName}`)
      return null
    }

    const result = data[0]

    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      country: result.address.country || 'Unknown',
      region: result.address.state || result.address.city || 'Unknown',
      fullName: result.display_name
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

interface OSMPlace {
  id: number
  lat: number
  lon: number
  tags: {
    name?: string
    cuisine?: string
    'addr:street'?: string
    'addr:housenumber'?: string
    'addr:city'?: string
    'addr:postcode'?: string
    phone?: string
    website?: string
    opening_hours?: string
    description?: string
    tourism?: string
    amenity?: string
  }
}

interface OSMResponse {
  elements: OSMPlace[]
}

/**
 * Fetch restaurants from OpenStreetMap
 */
export async function fetchRestaurantsFromOSM(
  lat: number,
  lng: number,
  radius: number = 5000
): Promise<any[]> {
  const query = `
    [out:json];
    (
      node["amenity"="restaurant"](around:${radius},${lat},${lng});
      node["amenity"="cafe"](around:${radius},${lat},${lng});
      node["amenity"="bar"](around:${radius},${lat},${lng});
    );
    out body;
  `

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.statusText}`)
    }

    const data: OSMResponse = await response.json()

    // Transform OSM data to our format
    return data.elements
      .filter(place => place.tags.name) // Only places with names
      .map(place => ({
        name: place.tags.name || 'Unknown',
        description: place.tags.description || '',
        cuisine: place.tags.cuisine || 'International',
        address: buildAddress(place.tags),
        phone: place.tags.phone || null,
        website: place.tags.website || null,
        opening_hours: place.tags.opening_hours || null,
        latitude: place.lat,
        longitude: place.lon,
        source: 'openstreetmap',
        osm_id: place.id
      }))
  } catch (error) {
    console.error('Error fetching from OpenStreetMap:', error)
    return []
  }
}

/**
 * Fetch tourist attractions and activities from OpenStreetMap
 */
export async function fetchActivitiesFromOSM(
  lat: number,
  lng: number,
  radius: number = 5000
): Promise<any[]> {
  const query = `
    [out:json];
    (
      node["tourism"="attraction"](around:${radius},${lat},${lng});
      node["tourism"="museum"](around:${radius},${lat},${lng});
      node["tourism"="viewpoint"](around:${radius},${lat},${lng});
      node["leisure"="park"](around:${radius},${lat},${lng});
      node["natural"="peak"](around:${radius},${lat},${lng});
      node["natural"="beach"](around:${radius},${lat},${lng});
    );
    out body;
  `

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.statusText}`)
    }

    const data: OSMResponse = await response.json()

    return data.elements
      .filter(place => place.tags.name)
      .map(place => ({
        name: place.tags.name || 'Unknown',
        description: place.tags.description || '',
        category: place.tags.tourism || place.tags.leisure || place.tags.natural || 'attraction',
        address: buildAddress(place.tags),
        website: place.tags.website || null,
        latitude: place.lat,
        longitude: place.lon,
        source: 'openstreetmap',
        osm_id: place.id
      }))
  } catch (error) {
    console.error('Error fetching activities from OpenStreetMap:', error)
    return []
  }
}

/**
 * Build address string from OSM tags
 */
function buildAddress(tags: OSMPlace['tags']): string {
  const parts = []
  
  if (tags['addr:housenumber']) parts.push(tags['addr:housenumber'])
  if (tags['addr:street']) parts.push(tags['addr:street'])
  if (tags['addr:city']) parts.push(tags['addr:city'])
  if (tags['addr:postcode']) parts.push(tags['addr:postcode'])
  
  return parts.length > 0 ? parts.join(', ') : 'Address not available'
}

/**
 * Save restaurants to Supabase
 */
export async function saveOSMRestaurantsToDatabase(
  locationId: string,
  restaurants: any[]
): Promise<void> {
  if (restaurants.length === 0) return

  const records = restaurants.map(r => ({
    location_id: locationId,
    name: r.name,
    description: r.description,
    cuisine: r.cuisine,
    address: r.address,
    phone: r.phone,
    website: r.website,
    latitude: r.latitude,
    longitude: r.longitude,
    source: 'openstreetmap',
    is_verified: false, // Needs manual verification
    metadata: {
      osm_id: r.osm_id,
      opening_hours: r.opening_hours
    }
  }))

  const { error } = await supabase
    .from('location_restaurants')
    .upsert(records, {
      onConflict: 'location_id,name',
      ignoreDuplicates: false
    })

  if (error) {
    console.error('Error saving restaurants to database:', error)
    throw error
  }

  console.log(`✅ Saved ${restaurants.length} restaurants from OpenStreetMap`)
}

/**
 * Save activities to Supabase
 */
export async function saveOSMActivitiesToDatabase(
  locationId: string,
  activities: any[]
): Promise<void> {
  if (activities.length === 0) return

  const records = activities.map(a => ({
    location_id: locationId,
    name: a.name,
    description: a.description,
    category: a.category,
    address: a.address,
    website: a.website,
    latitude: a.latitude,
    longitude: a.longitude,
    source: 'openstreetmap',
    is_verified: false,
    metadata: {
      osm_id: a.osm_id
    }
  }))

  const { error } = await supabase
    .from('location_activities')
    .upsert(records, {
      onConflict: 'location_id,name',
      ignoreDuplicates: false
    })

  if (error) {
    console.error('Error saving activities to database:', error)
    throw error
  }

  console.log(`✅ Saved ${activities.length} activities from OpenStreetMap`)
}

/**
 * Auto-fill location with OpenStreetMap data
 */
export async function autoFillLocationFromOSM(
  locationId: string,
  lat: number,
  lng: number
): Promise<{ restaurants: number; activities: number }> {
  console.log(`🗺️ Auto-filling location ${locationId} from OpenStreetMap...`)

  // Fetch data from OpenStreetMap
  const [restaurants, activities] = await Promise.all([
    fetchRestaurantsFromOSM(lat, lng),
    fetchActivitiesFromOSM(lat, lng)
  ])

  // Save to database
  await Promise.all([
    saveOSMRestaurantsToDatabase(locationId, restaurants),
    saveOSMActivitiesToDatabase(locationId, activities)
  ])

  return {
    restaurants: restaurants.length,
    activities: activities.length
  }
}

