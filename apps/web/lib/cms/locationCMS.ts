/**
 * CMS Integration Layer for Location Detail Pages
 * 
 * This module provides a clean interface between the location detail components
 * and any CMS backend (Strapi, Contentful, Sanity, etc.)
 * 
 * Key Features:
 * - Type-safe data fetching
 * - Caching and performance optimization
 * - Easy CMS provider switching
 * - Validation and error handling
 */

import { Location, LocationActivity, LocationRestaurant, LocationExperience, LocationDidYouKnow } from '@/lib/data/locationsData'

// CMS Configuration Interface
export interface CMSConfig {
  provider: 'strapi' | 'contentful' | 'sanity' | 'directus' | 'mock'
  apiUrl: string
  apiKey?: string
  cacheTimeout?: number
}

// CMS Response Types
export interface CMSLocationData {
  activities: LocationActivity[]
  restaurants: LocationRestaurant[]
  experiences: LocationExperience[]
  did_you_know: LocationDidYouKnow[]
  last_updated: string
  version: number
}

// Default CMS Configuration (using mock data for development)
const defaultConfig: CMSConfig = {
  provider: 'mock',
  apiUrl: process.env.NEXT_PUBLIC_CMS_API_URL || 'http://localhost:1337',
  apiKey: process.env.NEXT_PUBLIC_CMS_API_KEY,
  cacheTimeout: 300000 // 5 minutes
}

// In-memory cache for development
const cache = new Map<string, { data: CMSLocationData; timestamp: number }>()

/**
 * Fetch location-specific CMS data
 * This function abstracts the CMS provider and provides a consistent interface
 */
export async function fetchLocationCMSData(
  locationSlug: string,
  config: CMSConfig = defaultConfig
): Promise<CMSLocationData> {
  const cacheKey = `location-${locationSlug}`
  const now = Date.now()
  
  // Check cache first
  const cached = cache.get(cacheKey)
  if (cached && (now - cached.timestamp) < (config.cacheTimeout || 300000)) {
    return cached.data
  }

  try {
    let data: CMSLocationData

    switch (config.provider) {
      case 'strapi':
        data = await fetchFromStrapi(locationSlug, config)
        break
      case 'contentful':
        data = await fetchFromContentful(locationSlug, config)
        break
      case 'sanity':
        data = await fetchFromSanity(locationSlug, config)
        break
      case 'directus':
        data = await fetchFromDirectus(locationSlug, config)
        break
      default:
        data = await fetchMockData(locationSlug)
    }

    // Cache the result
    cache.set(cacheKey, { data, timestamp: now })
    return data

  } catch (error) {
    console.error(`Failed to fetch CMS data for ${locationSlug}:`, error)
    // Fallback to mock data
    return await fetchMockData(locationSlug)
  }
}

/**
 * Strapi CMS Integration
 */
async function fetchFromStrapi(locationSlug: string, config: CMSConfig): Promise<CMSLocationData> {
  const response = await fetch(
    `${config.apiUrl}/api/locations/${locationSlug}?populate=*`,
    {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Strapi API error: ${response.status}`)
  }

  const result = await response.json()
  return transformStrapiData(result.data)
}

/**
 * Contentful CMS Integration
 */
async function fetchFromContentful(locationSlug: string, config: CMSConfig): Promise<CMSLocationData> {
  const response = await fetch(
    `${config.apiUrl}/spaces/${process.env.CONTENTFUL_SPACE_ID}/entries?content_type=location&fields.slug=${locationSlug}&include=2`,
    {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Contentful API error: ${response.status}`)
  }

  const result = await response.json()
  return transformContentfulData(result.items[0])
}

/**
 * Sanity CMS Integration
 */
async function fetchFromSanity(locationSlug: string, config: CMSConfig): Promise<CMSLocationData> {
  const query = `*[_type == "location" && slug.current == "${locationSlug}"][0]{
    activities[]->,
    restaurants[]->,
    experiences[]->,
    didYouKnow[]->
  }`

  const response = await fetch(
    `${config.apiUrl}/v2021-10-21/data/query/${process.env.SANITY_PROJECT_ID}?query=${encodeURIComponent(query)}`,
    {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Sanity API error: ${response.status}`)
  }

  const result = await response.json()
  return transformSanityData(result.result)
}

/**
 * Directus CMS Integration
 */
async function fetchFromDirectus(locationSlug: string, config: CMSConfig): Promise<CMSLocationData> {
  const response = await fetch(
    `${config.apiUrl}/items/locations?filter[slug][_eq]=${locationSlug}&fields=*,activities.*,restaurants.*,experiences.*,did_you_know.*`,
    {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Directus API error: ${response.status}`)
  }

  const result = await response.json()
  return transformDirectusData(result.data[0])
}

/**
 * Mock Data for Development
 * Returns the data from our existing locationsData.ts file
 */
async function fetchMockData(locationSlug: string): Promise<CMSLocationData> {
  // Import dynamically to avoid circular dependencies
  const { getLocationBySlug } = await import('@/lib/data/locationsData')
  const location = getLocationBySlug(locationSlug)
  
  if (!location) {
    throw new Error(`Location not found: ${locationSlug}`)
  }

  return {
    activities: location.activities || [],
    restaurants: location.restaurants || [],
    experiences: location.experiences || [],
    did_you_know: location.did_you_know || [],
    last_updated: new Date().toISOString(),
    version: 1
  }
}

/**
 * Data transformation functions for different CMS providers
 * These functions normalize the CMS-specific data structures to our common interface
 */
function transformStrapiData(data: any): CMSLocationData {
  return {
    activities: data.attributes.activities?.data?.map((item: any) => ({
      id: item.id.toString(),
      name: item.attributes.name,
      description: item.attributes.description,
      completed: false,
      category: item.attributes.category,
      difficulty: item.attributes.difficulty,
      duration: item.attributes.duration,
      cost: item.attributes.cost
    })) || [],
    restaurants: data.attributes.restaurants?.data?.map((item: any) => ({
      id: item.id.toString(),
      name: item.attributes.name,
      description: item.attributes.description,
      cuisine: item.attributes.cuisine,
      price_range: item.attributes.price_range,
      rating: item.attributes.rating,
      image: item.attributes.image?.data?.attributes?.url || '',
      website: item.attributes.website,
      address: item.attributes.address,
      phone: item.attributes.phone,
      specialties: item.attributes.specialties || []
    })) || [],
    experiences: data.attributes.experiences?.data?.map((item: any) => ({
      id: item.id.toString(),
      title: item.attributes.title,
      description: item.attributes.description,
      image: item.attributes.image?.data?.attributes?.url || '',
      category: item.attributes.category,
      best_time: item.attributes.best_time,
      duration: item.attributes.duration,
      booking_required: item.attributes.booking_required,
      contact_info: item.attributes.contact_info
    })) || [],
    did_you_know: data.attributes.did_you_know?.data?.map((item: any) => ({
      id: item.id.toString(),
      title: item.attributes.title,
      content: item.attributes.content,
      category: item.attributes.category,
      icon: item.attributes.icon
    })) || [],
    last_updated: data.attributes.updatedAt,
    version: data.attributes.version || 1
  }
}

function transformContentfulData(data: any): CMSLocationData {
  // Implement Contentful-specific transformation
  return {
    activities: [],
    restaurants: [],
    experiences: [],
    did_you_know: [],
    last_updated: new Date().toISOString(),
    version: 1
  }
}

function transformSanityData(data: any): CMSLocationData {
  // Implement Sanity-specific transformation
  return {
    activities: [],
    restaurants: [],
    experiences: [],
    did_you_know: [],
    last_updated: new Date().toISOString(),
    version: 1
  }
}

function transformDirectusData(data: any): CMSLocationData {
  // Implement Directus-specific transformation
  return {
    activities: [],
    restaurants: [],
    experiences: [],
    did_you_know: [],
    last_updated: new Date().toISOString(),
    version: 1
  }
}

/**
 * Utility function to clear cache (useful for CMS webhooks)
 */
export function clearLocationCache(locationSlug?: string) {
  if (locationSlug) {
    cache.delete(`location-${locationSlug}`)
  } else {
    cache.clear()
  }
}

/**
 * Utility function to preload location data
 */
export async function preloadLocationData(locationSlugs: string[]) {
  const promises = locationSlugs.map(slug => fetchLocationCMSData(slug))
  await Promise.all(promises)
}
