/**
 * Geocoding Service
 * 
 * Converts location names to coordinates using FREE geocoding APIs:
 * 1. Nominatim (OpenStreetMap) - Primary, completely free
 * 2. OpenRouteService Geocoding - Fallback, 2000 requests/day
 * 
 * Implements caching to minimize API calls
 */

import { createServerSupabase } from '@/lib/supabase-server'

const ORS_API_KEY = process.env.OPENROUTESERVICE_API_KEY || process.env.NEXT_PUBLIC_OPENROUTESERVICE_API_KEY
const ORS_GEOCODE_URL = 'https://api.openrouteservice.org/geocode'
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org'

export interface GeocodedLocation {
  lat: number
  lng: number
  displayName: string
  country?: string
  city?: string
  region?: string
}

/**
 * Geocode a location name to coordinates
 */
export async function geocodeLocation(locationName: string): Promise<GeocodedLocation | null> {
  try {
    // Check cache first
    const cached = await getCachedGeocode(locationName)
    if (cached) {
      return cached
    }

    // Try Nominatim first (completely free, no API key needed)
    let result = await geocodeWithNominatim(locationName)
    
    // Fallback to OpenRouteService if Nominatim fails
    if (!result && ORS_API_KEY) {
      result = await geocodeWithOpenRouteService(locationName)
    }

    // Cache the result
    if (result) {
      await cacheGeocode(locationName, result)
    }

    return result
  } catch (error) {
    console.error('Error geocoding location:', error)
    return null
  }
}

/**
 * Geocode using Nominatim (OpenStreetMap)
 * FREE, no API key required
 * Rate limit: 1 request/second
 */
async function geocodeWithNominatim(locationName: string): Promise<GeocodedLocation | null> {
  try {
    const response = await fetch(
      `${NOMINATIM_URL}/search?` + new URLSearchParams({
        q: locationName,
        format: 'json',
        limit: '1',
        addressdetails: '1'
      }),
      {
        headers: {
          'User-Agent': 'TravelBlogr/1.0' // Required by Nominatim
        }
      }
    )

    if (!response.ok) {
      console.error('Nominatim API error:', response.status)
      return null
    }

    const data = await response.json()
    
    if (!data || data.length === 0) {
      return null
    }

    const result = data[0]
    
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      displayName: result.display_name,
      country: result.address?.country,
      city: result.address?.city || result.address?.town || result.address?.village,
      region: result.address?.state || result.address?.region
    }
  } catch (error) {
    console.error('Error with Nominatim geocoding:', error)
    return null
  }
}

/**
 * Geocode using OpenRouteService
 * FREE tier: 2000 requests/day
 */
async function geocodeWithOpenRouteService(locationName: string): Promise<GeocodedLocation | null> {
  try {
    if (!ORS_API_KEY) {
      return null
    }

    const response = await fetch(
      `${ORS_GEOCODE_URL}/search?` + new URLSearchParams({
        text: locationName,
        size: '1'
      }),
      {
        headers: {
          'Authorization': ORS_API_KEY,
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      console.error('OpenRouteService geocoding error:', response.status)
      return null
    }

    const data = await response.json()
    
    if (!data.features || data.features.length === 0) {
      return null
    }

    const feature = data.features[0]
    const coords = feature.geometry.coordinates
    const props = feature.properties
    
    return {
      lat: coords[1],
      lng: coords[0],
      displayName: props.label || props.name,
      country: props.country,
      city: props.locality || props.city,
      region: props.region
    }
  } catch (error) {
    console.error('Error with OpenRouteService geocoding:', error)
    return null
  }
}

/**
 * Get cached geocode result
 */
async function getCachedGeocode(locationName: string): Promise<GeocodedLocation | null> {
  try {
    const supabase = await createServerSupabase()
    
    // Check locations table first
    const { data: location } = await supabase
      .from('locations')
      .select('name, latitude, longitude, country, city, region')
      .ilike('name', `%${locationName}%`)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(1)
      .single()
    
    if (location && location.latitude && location.longitude) {
      return {
        lat: Number(location.latitude),
        lng: Number(location.longitude),
        displayName: location.name,
        country: location.country || undefined,
        city: location.city || undefined,
        region: location.region || undefined
      }
    }

    return null
  } catch (error) {
    // Not found in cache, will fetch from API
    return null
  }
}

/**
 * Cache geocode result in locations table
 */
async function cacheGeocode(locationName: string, result: GeocodedLocation): Promise<void> {
  try {
    const supabase = await createServerSupabase()
    
    // Generate slug from location name
    const slug = locationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    
    // Check if location already exists
    const { data: existing } = await supabase
      .from('locations')
      .select('id')
      .eq('slug', slug)
      .single()
    
    if (existing) {
      // Update existing location
      await supabase
        .from('locations')
        .update({
          latitude: result.lat,
          longitude: result.lng,
          country: result.country || 'Unknown',
          city: result.city,
          region: result.region
        })
        .eq('id', existing.id)
    } else {
      // Insert new location
      await supabase
        .from('locations')
        .insert({
          name: locationName,
          slug,
          latitude: result.lat,
          longitude: result.lng,
          country: result.country || 'Unknown',
          city: result.city,
          region: result.region,
          description: `Location: ${result.displayName}`,
          is_published: false // Mark as auto-generated, not manually curated
        })
    }
  } catch (error) {
    console.error('Error caching geocode result:', error)
  }
}

/**
 * Batch geocode multiple locations
 * Implements rate limiting to respect API limits
 */
export async function batchGeocodeLocations(
  locationNames: string[]
): Promise<Map<string, GeocodedLocation>> {
  const results = new Map<string, GeocodedLocation>()
  
  for (const locationName of locationNames) {
    const result = await geocodeLocation(locationName)
    if (result) {
      results.set(locationName, result)
    }
    
    // Rate limiting: Wait 1 second between requests for Nominatim
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  return results
}

