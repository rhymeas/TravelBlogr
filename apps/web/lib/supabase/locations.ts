/**
 * Supabase Location Data Functions
 * Fetches real location data from Supabase database
 */

import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// Helper function to create Supabase client at runtime (not build time)
function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
  }

  return createClient(supabaseUrl, supabaseKey)
}

// Lazy singleton - only created when first accessed
let _supabaseInstance: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (!_supabaseInstance) {
    _supabaseInstance = getSupabaseClient()
  }
  return _supabaseInstance
}

// For backwards compatibility with existing code
const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    return getSupabase()[prop as keyof SupabaseClient]
  }
})

export { supabase }

/**
 * Location interface matching Supabase schema
 */
export interface SupabaseLocation {
  id: string
  name: string
  slug: string
  country: string
  region: string
  city?: string
  description: string
  content?: {
    weather?: {
      temp: number
      description: string
      humidity: number
      wind_speed: number
      fetched_at: string
    }
  }
  latitude: number
  longitude: number
  featured_image?: string
  gallery_images?: string[]
  timezone?: string
  currency?: string
  language?: string
  best_time_to_visit?: string
  budget_info?: string
  rating?: number
  visit_count: number
  last_visited?: string
  is_featured: boolean
  is_published: boolean
  seo_title?: string
  seo_description?: string
  created_at: string
  updated_at: string
}

export interface SupabaseRestaurant {
  id: string
  location_id: string
  name: string
  description?: string
  cuisine_type?: string
  address?: string
  latitude?: number
  longitude?: number
  phone?: string
  website?: string
  opening_hours?: any
  price_range?: string
  rating?: number
  image_url?: string
  source: string
  external_id?: string
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface SupabaseActivity {
  id: string
  location_id: string
  name: string
  description?: string
  category?: string
  address?: string
  latitude?: number
  longitude?: number
  phone?: string
  website?: string
  opening_hours?: any
  price_info?: string
  duration?: string
  rating?: number
  image_url?: string
  source: string
  external_id?: string
  is_verified: boolean
  created_at: string
  updated_at: string
}

/**
 * Get a single location by slug with all related data
 */
export async function getLocationBySlug(slug: string) {
  try {
    // First, try to get the location without is_published filter
    const { data, error } = await supabase
      .from('locations')
      .select(`
        *,
        restaurants (*),
        activities (*)
      `)
      .eq('slug', slug)
      .single()

    if (error) {
      console.error('Error fetching location:', error)
      return null
    }

    return data as SupabaseLocation & {
      restaurants: SupabaseRestaurant[]
      activities: SupabaseActivity[]
    }
  } catch (error) {
    console.error('Error in getLocationBySlug:', error)
    return null
  }
}

/**
 * Get all published locations
 */
export async function getAllLocations() {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching locations:', error)
      return []
    }

    return data as SupabaseLocation[]
  } catch (error) {
    console.error('Error in getAllLocations:', error)
    return []
  }
}

/**
 * Get featured locations for homepage
 */
export async function getFeaturedLocations(limit: number = 8) {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('is_featured', true)
      .order('rating', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching featured locations:', error)
      return []
    }

    return data as SupabaseLocation[]
  } catch (error) {
    console.error('Error in getFeaturedLocations:', error)
    return []
  }
}

/**
 * Get locations by country
 */
export async function getLocationsByCountry(country: string, excludeId?: string, limit: number = 4) {
  try {
    let query = supabase
      .from('locations')
      .select('*')
      .eq('country', country)
      .order('rating', { ascending: false })
      .limit(limit)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching locations by country:', error)
      return []
    }

    return data as SupabaseLocation[]
  } catch (error) {
    console.error('Error in getLocationsByCountry:', error)
    return []
  }
}

/**
 * Search locations by name, country, or region
 */
export async function searchLocations(query: string, limit: number = 10) {
  try {
    const searchTerm = `%${query}%`

    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .or(`name.ilike.${searchTerm},country.ilike.${searchTerm},region.ilike.${searchTerm}`)
      .order('rating', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error searching locations:', error)
      return []
    }

    return data as SupabaseLocation[]
  } catch (error) {
    console.error('Error in searchLocations:', error)
    return []
  }
}

/**
 * Get related locations (same country or similar)
 */
export async function getRelatedLocations(currentLocationId: string, country: string, limit: number = 4) {
  try {
    // First try to get locations from the same country
    const { data: sameCountry, error: error1 } = await supabase
      .from('locations')
      .select('*')
      .eq('country', country)
      .neq('id', currentLocationId)
      .order('rating', { ascending: false })
      .limit(limit)

    if (error1) {
      console.error('Error fetching related locations:', error1)
    }

    // If we have enough, return them
    if (sameCountry && sameCountry.length >= limit) {
      return sameCountry as SupabaseLocation[]
    }

    // Otherwise, get more from other countries
    const needed = limit - (sameCountry?.length || 0)
    const { data: others, error: error2 } = await supabase
      .from('locations')
      .select('*')
      .neq('id', currentLocationId)
      .neq('country', country)
      .order('rating', { ascending: false })
      .limit(needed)

    if (error2) {
      console.error('Error fetching other locations:', error2)
    }

    return [...(sameCountry || []), ...(others || [])] as SupabaseLocation[]
  } catch (error) {
    console.error('Error in getRelatedLocations:', error)
    return []
  }
}

/**
 * Increment visit count for a location
 */
export async function incrementVisitCount(locationId: string) {
  try {
    const { error } = await supabase.rpc('increment_visit_count', {
      location_id: locationId
    })

    if (error) {
      console.error('Error incrementing visit count:', error)
    }
  } catch (error) {
    console.error('Error in incrementVisitCount:', error)
  }
}

/**
 * Get all location slugs for static generation
 */
export async function getAllLocationSlugs() {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('slug')

    if (error) {
      console.error('Error fetching location slugs:', error)
      return []
    }

    return data.map(item => item.slug)
  } catch (error) {
    console.error('Error in getAllLocationSlugs:', error)
    return []
  }
}

