/**
 * Yelp Fusion API Service
 * Free tier: 5000 calls/day
 */

import type { ComprehensivePOI } from './comprehensivePOIService'

const YELP_API_KEY = process.env.YELP_API_KEY
const YELP_BASE_URL = 'https://api.yelp.com/v3/businesses'

export async function getYelpPOIs(
  lat: number,
  lon: number,
  radius: number = 5000,
  categories?: string[]
): Promise<ComprehensivePOI[]> {
  if (!YELP_API_KEY) {
    console.warn('⚠️ Yelp API key not configured')
    return []
  }

  try {
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      radius: Math.min(radius, 40000).toString(), // Yelp max: 40km
      limit: '50',
      sort_by: 'best_match'
    })

    if (categories && categories.length > 0) {
      params.append('categories', categories.join(','))
    }

    const response = await fetch(`${YELP_BASE_URL}/search?${params}`, {
      headers: {
        'Authorization': `Bearer ${YELP_API_KEY}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Yelp API error: ${response.status}`)
    }

    const data = await response.json()
    
    return (data.businesses || []).map((business: any) => ({
      id: `yelp_${business.id}`,
      name: business.name,
      category: mapYelpCategory(business.categories?.[0]?.alias),
      lat: business.coordinates?.latitude || lat,
      lon: business.coordinates?.longitude || lon,
      description: business.categories?.map((c: any) => c.title).join(', ') || '',
      address: business.location?.display_address?.join(', ') || '',
      rating: business.rating,
      source: 'yelp',
      relevanceScore: 75,
      metadata: {
        categories: business.categories?.map((c: any) => c.title) || [],
        distance: business.distance,
        price: business.price,
        reviewCount: business.review_count,
        phone: business.phone,
        url: business.url,
        image: business.image_url,
        isClosed: business.is_closed
      }
    }))
  } catch (error) {
    console.error('Yelp API error:', error)
    return []
  }
}

function mapYelpCategory(alias?: string): string {
  if (!alias) return 'other'
  
  if (alias.includes('restaurant') || alias.includes('food')) return 'food'
  if (alias.includes('hotel') || alias.includes('lodging')) return 'accommodation'
  if (alias.includes('museum') || alias.includes('galleries')) return 'museum'
  if (alias.includes('parks') || alias.includes('gardens')) return 'nature'
  if (alias.includes('landmarks') || alias.includes('monuments')) return 'monument'
  if (alias.includes('shopping')) return 'shopping'
  if (alias.includes('bars') || alias.includes('nightlife')) return 'nightlife'
  if (alias.includes('beaches')) return 'beach'
  if (alias.includes('tours') || alias.includes('sightseeing')) return 'tour'
  
  return 'other'
}

