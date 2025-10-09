/**
 * Location Data Mapper
 * Converts Supabase data to Frontend format
 */

import { SupabaseLocation, SupabaseRestaurant, SupabaseActivity } from '@/lib/supabase/locations'
import { Location, LocationRestaurant, LocationActivity } from '@/lib/data/locationsData'
import { generateActivityTags, mapActivityCategory } from '@/lib/utils/activityTags'

/**
 * Map Supabase location to frontend Location interface
 */
export function mapSupabaseLocationToFrontend(
  supabaseData: SupabaseLocation & {
    restaurants?: SupabaseRestaurant[]
    activities?: SupabaseActivity[]
  }
): Location {
  // Build images array with featured_image ALWAYS first
  // Filter out placeholder images from gallery
  const featuredImage = supabaseData.featured_image || '/placeholder-location.svg'
  const galleryImages = (supabaseData.gallery_images || [])
    .filter(img =>
      img &&
      !img.includes('picsum.photos') && // Remove placeholder images
      !img.includes('placeholder') &&
      img !== featuredImage // Don't duplicate featured image
    )

  // Always start with featured image, then add real gallery images
  const images = [featuredImage, ...galleryImages]

  return {
    id: supabaseData.id,
    name: supabaseData.name,
    slug: supabaseData.slug,
    country: supabaseData.country,
    region: supabaseData.region,
    description: supabaseData.description || `Discover ${supabaseData.name}`,
    featured_image: featuredImage,
    rating: supabaseData.rating || 0,
    visit_count: supabaseData.visit_count || 0,
    is_featured: supabaseData.is_featured || false,
    created_at: formatDate(supabaseData.created_at),
    images: images,
    posts: [], // User posts - separate feature
    activities: mapActivities(supabaseData.activities || []),
    restaurants: mapRestaurants(supabaseData.restaurants || []),
    experiences: [], // Curated experiences - can be added later
    did_you_know: [], // Fun facts - can be added later
    latitude: supabaseData.latitude,
    longitude: supabaseData.longitude
  }
}

/**
 * Map Supabase restaurants to frontend format
 */
function mapRestaurants(supabaseRestaurants: SupabaseRestaurant[]): LocationRestaurant[] {
  return supabaseRestaurants.map(restaurant => ({
    id: restaurant.id,
    name: restaurant.name,
    cuisine: restaurant.cuisine_type || 'International',
    description: restaurant.description || '',
    price_range: restaurant.price_range || '$$',
    rating: restaurant.rating || 0,
    image: restaurant.image_url || '/placeholder-restaurant.svg',
    address: restaurant.address || 'Address not available',
    phone: restaurant.phone || undefined,
    website: restaurant.website || undefined,
    opening_hours: formatOpeningHours(restaurant.opening_hours),
    verified: restaurant.is_verified,
    latitude: restaurant.latitude,
    longitude: restaurant.longitude
  }))
}

/**
 * Map Supabase activities to frontend format
 */
function mapActivities(supabaseActivities: SupabaseActivity[]): LocationActivity[] {
  return supabaseActivities.map(activity => {
    // Generate tags automatically
    const tags = generateActivityTags({
      category: activity.category,
      name: activity.name,
      description: activity.description,
      price_info: activity.price_info,
      duration: activity.duration,
      opening_hours: activity.opening_hours
    })

    return {
      id: activity.id,
      name: activity.name,
      category: mapActivityCategory(activity.category) as any,
      description: activity.description || '',
      completed: false,
      // Use generated tags
      difficulty: tags.difficulty,
      duration: tags.duration,
      cost: tags.cost,
      // Legacy fields for compatibility
      price: activity.price_info || 'Free',
      rating: activity.rating || 0,
      image: activity.image_url || '/placeholder-activity.svg',
      address: activity.address || 'Address not available',
      website: activity.website || undefined,
      opening_hours: formatOpeningHours(activity.opening_hours),
      verified: activity.is_verified,
      latitude: activity.latitude,
      longitude: activity.longitude
    }
  })
}

/**
 * Format opening hours from JSONB to string
 */
function formatOpeningHours(hours: any): string {
  if (!hours) return 'Hours not available'
  
  if (typeof hours === 'string') return hours
  
  if (hours.hours) return hours.hours
  
  // If it's a structured object, format it
  if (typeof hours === 'object') {
    return 'See website for hours'
  }
  
  return 'Hours not available'
}

/**
 * Format date to readable string
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    return dateString
  }
}

/**
 * Map multiple Supabase locations to frontend format
 */
export function mapSupabaseLocationsToFrontend(
  supabaseLocations: SupabaseLocation[]
): Location[] {
  return supabaseLocations.map(location => 
    mapSupabaseLocationToFrontend(location as any)
  )
}

