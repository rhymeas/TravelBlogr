/**
 * Nominatim (OpenStreetMap) Service
 * Free, 1 request/second limit
 */

import type { ComprehensivePOI } from './comprehensivePOIService'

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org'

let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1000 // 1 second

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest))
  }

  lastRequestTime = Date.now()

  return fetch(url, {
    headers: {
      'User-Agent': 'TravelBlogr/1.0'
    }
  })
}
export async function geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
  try {
    if (!address || address.trim().length < 3) return null
    const url = `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=0`
    const response = await rateLimitedFetch(url)
    if (!response.ok) return null
    const data = await response.json()
    if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
    }
    return null
  } catch {
    return null
  }
}


export async function getNominatimPOIs(
  lat: number,
  lon: number,
  radius: number = 5000
): Promise<ComprehensivePOI[]> {
  try {
    // Search for nearby places
    const url = `${NOMINATIM_BASE_URL}/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&extratags=1&namedetails=1`

    const response = await rateLimitedFetch(url)

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`)
    }

    const data = await response.json()

    if (!data || data.error) {
      return []
    }

    // Extract POIs from the response
    const pois: ComprehensivePOI[] = []

    if (data.name) {
      pois.push({
        id: `nominatim_${data.place_id}`,
        name: data.name,
        category: mapNominatimCategory(data.type, data.class),
        lat: parseFloat(data.lat),
        lon: parseFloat(data.lon),
        description: data.display_name || '',
        address: data.display_name || '',
        source: 'nominatim',
        relevanceScore: 60,
        metadata: {
          osmId: data.osm_id,
          osmType: data.osm_type,
          type: data.type,
          class: data.class,
          importance: data.importance,
          extratags: data.extratags
        }
      })
    }

    return pois
  } catch (error) {
    console.error('Nominatim API error:', error)
    return []
  }
}

function mapNominatimCategory(type?: string, osmClass?: string): string {
  if (!type && !osmClass) return 'other'

  const typeStr = (type || '').toLowerCase()
  const classStr = (osmClass || '').toLowerCase()

  if (classStr === 'tourism') {
    if (typeStr.includes('hotel') || typeStr.includes('hostel')) return 'accommodation'
    if (typeStr.includes('museum')) return 'museum'
    if (typeStr.includes('attraction')) return 'attraction'
    if (typeStr.includes('viewpoint')) return 'viewpoint'
    return 'tourism'
  }

  if (classStr === 'amenity') {
    if (typeStr.includes('restaurant') || typeStr.includes('cafe')) return 'food'
    if (typeStr.includes('bar') || typeStr.includes('pub')) return 'nightlife'
    return 'amenity'
  }

  if (classStr === 'historic') return 'monument'
  if (classStr === 'natural') return 'nature'
  if (classStr === 'leisure') return 'leisure'

  return 'other'
}

