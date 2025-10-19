/**
 * Blog Enrichment Service
 * 
 * Enriches blog post data with:
 * - Location images
 * - POIs (Points of Interest)
 * - Public transportation information
 * - Location coordinates
 * 
 * Uses existing data sources:
 * - Supabase database (locations, activities)
 * - OpenTripMap API (POIs)
 * - OpenStreetMap Overpass API (transportation)
 * - Enhanced Image Service (location images)
 */

import { getBrowserSupabase } from '@/lib/supabase'
import { fetchLocationImageHighQuality } from './enhancedImageService'

// Dynamic import for server-only code
async function getSupabaseClient(useServerClient: boolean) {
  if (useServerClient) {
    const { createServiceSupabase } = await import('@/lib/supabase-server')
    return createServiceSupabase()
  }
  return getBrowserSupabase()
}

export interface EnrichedLocation {
  name: string
  coordinates?: { lat: number; lng: number }
  image?: string
  pois?: Array<{
    name: string
    category: string
    description?: string
    coordinates?: { lat: number; lng: number }
  }>
  transportation?: {
    providers?: string[]
    tips?: string
  }
}

/**
 * Enrich a location with images, POIs, and transportation data
 */
export async function enrichLocation(
  locationName: string,
  useServerClient = false
): Promise<EnrichedLocation> {
  const supabase = await getSupabaseClient(useServerClient)

  console.log(`🔍 Enriching location: ${locationName}`)

  // 1. Check if location exists in database
  const { data: dbLocation } = await supabase
    .from('locations')
    .select('*')
    .ilike('name', `%${locationName}%`)
    .limit(1)
    .single()

  let coordinates: { lat: number; lng: number } | undefined
  let image: string | undefined
  let region: string | undefined
  let country: string | undefined

  if (dbLocation) {
    coordinates = {
      lat: dbLocation.latitude,
      lng: dbLocation.longitude
    }
    image = dbLocation.featured_image || undefined
    region = dbLocation.region || undefined
    country = dbLocation.country || undefined
  }

  // 2. If no coordinates, geocode the location
  if (!coordinates) {
    coordinates = await geocodeLocation(locationName)
  }

  // 3. Fetch high-quality image if not in database
  if (!image && coordinates) {
    try {
      image = await fetchLocationImageHighQuality(
        locationName,
        undefined,
        region,
        country
      )
    } catch (error) {
      console.error('Error fetching location image:', error)
    }
  }

  // 4. Fetch POIs from database or OpenTripMap
  let pois: EnrichedLocation['pois'] = []
  if (coordinates) {
    pois = await fetchPOIs(locationName, coordinates.lat, coordinates.lng, useServerClient)
  }

  // 5. Fetch transportation data
  let transportation: EnrichedLocation['transportation'] | undefined
  if (coordinates) {
    transportation = await fetchTransportation(locationName, coordinates.lat, coordinates.lng)
  }

  return {
    name: locationName,
    coordinates,
    image,
    pois,
    transportation
  }
}

/**
 * Geocode a location name to coordinates using GeoNames
 */
async function geocodeLocation(locationName: string): Promise<{ lat: number; lng: number } | undefined> {
  try {
    const response = await fetch(
      `http://api.geonames.org/searchJSON?q=${encodeURIComponent(locationName)}&maxRows=1&username=travelblogr`
    )
    
    if (!response.ok) return undefined
    
    const data = await response.json()
    if (data.geonames && data.geonames.length > 0) {
      const result = data.geonames[0]
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lng)
      }
    }
  } catch (error) {
    console.error('Geocoding error:', error)
  }
  
  return undefined
}

/**
 * Fetch POIs using comprehensive multi-source system with GROQ fallback
 */
async function fetchPOIs(
  locationName: string,
  lat: number,
  lng: number,
  useServerClient = false
): Promise<EnrichedLocation['pois']> {
  try {
    // Use comprehensive POI service with GROQ fallback
    const { getComprehensivePOIs } = await import('./comprehensivePOIService')

    const pois = await getComprehensivePOIs({
      locationName,
      coordinates: { lat, lng },
      travelType: 'city-break', // Default for blog posts
      limit: 6
    }, useServerClient)

    return pois.map(poi => ({
      name: poi.name,
      category: poi.type || poi.category,
      description: poi.description,
      coordinates: poi.coordinates
    }))
  } catch (error) {
    console.error('Comprehensive POI fetch error:', error)
    return []
  }
}

/**
 * Fetch public transportation providers using Overpass API
 */
async function fetchTransportation(
  locationName: string,
  lat: number,
  lng: number
): Promise<EnrichedLocation['transportation']> {
  try {
    // Query Overpass API for public transport operators
    const radius = 10000 // 10km
    const query = `
      [out:json][timeout:25];
      (
        node["public_transport"="station"](around:${radius},${lat},${lng});
        way["public_transport"="station"](around:${radius},${lat},${lng});
        relation["public_transport"="station"](around:${radius},${lat},${lng});
      );
      out tags;
    `
    
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query
    })
    
    if (!response.ok) return undefined
    
    const data = await response.json()
    
    // Extract unique operators
    const operators = new Set<string>()
    data.elements?.forEach((element: any) => {
      if (element.tags?.operator) {
        operators.add(element.tags.operator)
      }
      if (element.tags?.network) {
        operators.add(element.tags.network)
      }
    })
    
    const providers = Array.from(operators).slice(0, 5) // Limit to 5 providers
    
    if (providers.length === 0) return undefined
    
    return {
      providers,
      tips: `${locationName} has ${providers.length} public transportation provider${providers.length > 1 ? 's' : ''} available.`
    }
  } catch (error) {
    console.error('Transportation fetch error:', error)
    return undefined
  }
}

/**
 * Enrich all days in a blog post with location data
 */
export async function enrichBlogPostDays(
  days: Array<{
    day_number: number
    title: string
    description: string
    activities: string[]
    tips?: string
    location?: {
      name: string
      coordinates?: { lat: number; lng: number }
    }
  }>,
  useServerClient = false
): Promise<Array<{
  day_number: number
  title: string
  description: string
  activities: string[]
  tips?: string
  location?: EnrichedLocation
}>> {
  console.log(`🎨 Enriching ${days.length} days with location data...`)

  const enrichedDays = await Promise.all(
    days.map(async (day) => {
      if (!day.location?.name) {
        return day
      }

      const enrichedLocation = await enrichLocation(day.location.name, useServerClient)

      return {
        ...day,
        location: enrichedLocation
      }
    })
  )

  console.log(`✅ Enriched ${enrichedDays.length} days`)
  return enrichedDays
}

