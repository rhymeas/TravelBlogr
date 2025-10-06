/**
 * Schema.org JSON-LD Extractor
 * Extracts structured data from web pages
 */

import * as cheerio from 'cheerio'
import type {
  SchemaOrgRestaurant,
  RestaurantData,
  SchemaOrgAddress,
} from '../../types'

/**
 * Extract all JSON-LD scripts from HTML
 */
export function extractJsonLd(html: string): any[] {
  const $ = cheerio.load(html)
  const jsonLdScripts: any[] = []

  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const content = $(element).html()
      if (content) {
        const parsed = JSON.parse(content)
        // Handle both single objects and arrays
        if (Array.isArray(parsed)) {
          jsonLdScripts.push(...parsed)
        } else {
          jsonLdScripts.push(parsed)
        }
      }
    } catch (error) {
      console.warn('Failed to parse JSON-LD:', error)
    }
  })

  return jsonLdScripts
}

/**
 * Find Restaurant schema from JSON-LD data
 */
export function findRestaurantSchema(
  jsonLdData: any[]
): SchemaOrgRestaurant | null {
  for (const item of jsonLdData) {
    // Check if it's a Restaurant or FoodEstablishment
    if (
      item['@type'] === 'Restaurant' ||
      item['@type'] === 'FoodEstablishment' ||
      (Array.isArray(item['@type']) &&
        (item['@type'].includes('Restaurant') ||
          item['@type'].includes('FoodEstablishment')))
    ) {
      return item as SchemaOrgRestaurant
    }

    // Check nested @graph property (common in WordPress sites)
    if (item['@graph'] && Array.isArray(item['@graph'])) {
      const nested = findRestaurantSchema(item['@graph'])
      if (nested) return nested
    }
  }

  return null
}

/**
 * Convert Schema.org Restaurant to our RestaurantData format
 */
export function schemaToRestaurantData(
  schema: SchemaOrgRestaurant,
  sourceUrl: string
): RestaurantData {
  const cuisine = Array.isArray(schema.servesCuisine)
    ? schema.servesCuisine.join(', ')
    : schema.servesCuisine || 'Unknown'

  const address = formatAddress(schema.address)

  const imageUrl = Array.isArray(schema.image)
    ? schema.image[0]
    : schema.image

  const data: RestaurantData = {
    name: schema.name,
    description: schema.description,
    cuisine,
    price_range: schema.priceRange,
    rating: schema.aggregateRating?.ratingValue,
    review_count: schema.aggregateRating?.reviewCount,
    address,
    phone: schema.telephone,
    website: schema.url,
    menu_url: schema.hasMenu,
    image_url: imageUrl,
    latitude: schema.geo?.latitude,
    longitude: schema.geo?.longitude,
    source_url: sourceUrl,
    crawled_at: new Date().toISOString(),
  }

  // Extract specialties from description if available
  if (schema.description) {
    data.specialties = extractSpecialties(schema.description)
  }

  return data
}

/**
 * Format Schema.org address to string
 */
function formatAddress(address?: SchemaOrgAddress): string | undefined {
  if (!address) return undefined

  const parts = [
    address.streetAddress,
    address.addressLocality,
    address.addressRegion,
    address.postalCode,
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(', ') : undefined
}

/**
 * Extract specialties/keywords from description
 */
function extractSpecialties(description: string): string[] {
  const specialties: string[] = []

  // Common food-related keywords
  const keywords = [
    'pizza',
    'pasta',
    'sushi',
    'burger',
    'steak',
    'seafood',
    'vegan',
    'vegetarian',
    'gluten-free',
    'organic',
    'farm-to-table',
    'craft beer',
    'wine',
    'cocktails',
    'brunch',
    'breakfast',
    'lunch',
    'dinner',
    'dessert',
    'bakery',
    'cafe',
    'coffee',
  ]

  const lowerDesc = description.toLowerCase()

  keywords.forEach((keyword) => {
    if (lowerDesc.includes(keyword)) {
      specialties.push(keyword.charAt(0).toUpperCase() + keyword.slice(1))
    }
  })

  return [...new Set(specialties)].slice(0, 5) // Max 5 unique specialties
}

/**
 * Extract restaurant data from HTML (fallback if no JSON-LD)
 */
export function extractRestaurantFromHtml(
  html: string,
  sourceUrl: string
): RestaurantData | null {
  const $ = cheerio.load(html)

  // Try to find restaurant name
  const name =
    $('h1').first().text().trim() ||
    $('[itemprop="name"]').first().text().trim() ||
    $('title').text().split('|')[0].trim()

  if (!name) return null

  // Try to find description
  const description =
    $('[itemprop="description"]').first().text().trim() ||
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content')

  // Try to find address
  const address =
    $('[itemprop="address"]').text().trim() ||
    $('.address').first().text().trim()

  // Try to find phone
  const phone =
    $('[itemprop="telephone"]').text().trim() ||
    $('a[href^="tel:"]').first().text().trim()

  // Try to find image
  const image_url =
    $('meta[property="og:image"]').attr('content') ||
    $('[itemprop="image"]').attr('src') ||
    $('img').first().attr('src')

  return {
    name,
    description,
    cuisine: 'Unknown', // Can't reliably extract without structured data
    address,
    phone,
    image_url,
    source_url: sourceUrl,
    crawled_at: new Date().toISOString(),
  }
}

/**
 * Validate restaurant data
 */
export function validateRestaurantData(
  data: RestaurantData
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Restaurant name is required')
  }

  if (data.name && data.name.length > 200) {
    errors.push('Restaurant name is too long (max 200 characters)')
  }

  if (data.description && data.description.length > 1000) {
    errors.push('Description is too long (max 1000 characters)')
  }

  if (data.rating && (data.rating < 0 || data.rating > 5)) {
    errors.push('Rating must be between 0 and 5')
  }

  if (data.phone && !/^[\d\s\-\+\(\)]+$/.test(data.phone)) {
    errors.push('Invalid phone number format')
  }

  if (data.website && !isValidUrl(data.website)) {
    errors.push('Invalid website URL')
  }

  if (data.latitude && (data.latitude < -90 || data.latitude > 90)) {
    errors.push('Invalid latitude')
  }

  if (data.longitude && (data.longitude < -180 || data.longitude > 180)) {
    errors.push('Invalid longitude')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Check if string is a valid URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Normalize price range to consistent format
 */
export function normalizePriceRange(priceRange?: string): string | undefined {
  if (!priceRange) return undefined

  // Convert various formats to $ symbols
  const normalized = priceRange.toLowerCase()

  if (normalized.includes('budget') || normalized.includes('cheap')) {
    return '$'
  }
  if (normalized.includes('moderate') || normalized.includes('mid')) {
    return '$$'
  }
  if (normalized.includes('expensive') || normalized.includes('upscale')) {
    return '$$$'
  }
  if (normalized.includes('luxury') || normalized.includes('fine dining')) {
    return '$$$$'
  }

  // If already in $ format, return as is
  if (/^\$+$/.test(priceRange)) {
    return priceRange
  }

  return priceRange
}

