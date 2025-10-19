/**
 * Foursquare Places API Service
 * Free tier: 950 calls/day
 */

import type { ComprehensivePOI } from './comprehensivePOIService'

const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY
const FOURSQUARE_BASE_URL = 'https://api.foursquare.com/v3/places'

export async function getFoursquarePOIs(
  lat: number,
  lon: number,
  radius: number = 5000,
  categories?: string[]
): Promise<ComprehensivePOI[]> {
  if (!FOURSQUARE_API_KEY) {
    console.warn('⚠️ Foursquare API key not configured')
    return []
  }

  try {
    const params = new URLSearchParams({
      ll: `${lat},${lon}`,
      radius: radius.toString(),
      limit: '50',
      sort: 'RELEVANCE'
    })

    if (categories && categories.length > 0) {
      params.append('categories', categories.join(','))
    }

    const response = await fetch(`${FOURSQUARE_BASE_URL}/search?${params}`, {
      headers: {
        'Authorization': FOURSQUARE_API_KEY,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Foursquare API error: ${response.status}`)
    }

    const data = await response.json()
    
    return (data.results || []).map((place: any) => ({
      id: `foursquare_${place.fsq_id}`,
      name: place.name,
      category: mapFoursquareCategory(place.categories?.[0]?.name),
      lat: place.geocodes?.main?.latitude || lat,
      lon: place.geocodes?.main?.longitude || lon,
      description: place.description || '',
      address: place.location?.formatted_address || '',
      rating: place.rating ? place.rating / 2 : undefined, // Convert 0-10 to 0-5
      source: 'foursquare',
      relevanceScore: 70,
      metadata: {
        categories: place.categories?.map((c: any) => c.name) || [],
        distance: place.distance,
        price: place.price,
        hours: place.hours,
        website: place.website,
        phone: place.tel
      }
    }))
  } catch (error) {
    console.error('Foursquare API error:', error)
    return []
  }
}

function mapFoursquareCategory(category?: string): string {
  if (!category) return 'other'
  
  const lower = category.toLowerCase()
  
  if (lower.includes('restaurant') || lower.includes('food')) return 'food'
  if (lower.includes('hotel') || lower.includes('lodging')) return 'accommodation'
  if (lower.includes('museum') || lower.includes('gallery')) return 'museum'
  if (lower.includes('park') || lower.includes('garden')) return 'nature'
  if (lower.includes('monument') || lower.includes('landmark')) return 'monument'
  if (lower.includes('shop') || lower.includes('store')) return 'shopping'
  if (lower.includes('bar') || lower.includes('nightlife')) return 'nightlife'
  if (lower.includes('beach')) return 'beach'
  if (lower.includes('viewpoint') || lower.includes('scenic')) return 'viewpoint'
  
  return 'other'
}

