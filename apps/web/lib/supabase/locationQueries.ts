/**
 * Supabase Query Functions for Location Data
 * Centralized location for all location-related database queries
 */

import { createClient } from '@supabase/supabase-js'

// Create Supabase client (server-side)
export function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  return createClient(supabaseUrl, supabaseKey)
}

/**
 * Fetch location by slug with all related data
 */
export async function fetchLocationBySlug(slug: string) {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .from('locations')
    .select(`
      *,
      restaurants (*),
      activities (*),
      attractions (*)
    `)
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching location:', error)
    return null
  }

  return data
}

/**
 * Fetch attractions for a location
 */
export async function fetchLocationAttractions(locationId: string) {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .from('attractions')
    .select('*')
    .eq('location_id', locationId)
    .order('rating', { ascending: false, nullsFirst: false })

  if (error) {
    console.error('Error fetching attractions:', error)
    return []
  }

  return data || []
}

/**
 * Fetch weather data for a location
 */
export async function fetchLocationWeather(locationId: string) {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('location_weather')
    .select('*')
    .eq('location_id', locationId)
    .single()

  if (error) {
    console.error('Error fetching weather:', error)
    return null
  }

  return data
}

/**
 * Fetch restaurants for a location
 */
export async function fetchLocationRestaurants(locationId: string, verifiedOnly = true) {
  const supabase = createSupabaseClient()

  let query = supabase
    .from('restaurants')
    .select('*')
    .eq('location_id', locationId)
    .order('rating', { ascending: false })

  if (verifiedOnly) {
    query = query.eq('is_verified', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching restaurants:', error)
    return []
  }

  return data || []
}

/**
 * Fetch activities for a location
 */
export async function fetchLocationActivities(locationId: string, verifiedOnly = true) {
  const supabase = createSupabaseClient()

  let query = supabase
    .from('activities')
    .select('*')
    .eq('location_id', locationId)
    .order('created_at', { ascending: false })

  if (verifiedOnly) {
    query = query.eq('is_verified', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching activities:', error)
    return []
  }

  return data || []
}

/**
 * Fetch all locations (for listings)
 */
export async function fetchAllLocations(limit = 50) {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('locations')
    .select(`
      id,
      name,
      slug,
      description,
      country,
      region,
      city,
      latitude,
      longitude,
      featured_image,
      rating,
      visit_count,
      is_featured,
      created_at
    `)
    .order('visit_count', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching locations:', error)
    return []
  }

  return data || []
}

/**
 * Fetch featured locations
 */
export async function fetchFeaturedLocations(limit = 8) {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('locations')
    .select(`
      id,
      name,
      slug,
      description,
      country,
      region,
      featured_image,
      rating,
      visit_count
    `)
    .eq('is_featured', true)
    .order('visit_count', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching featured locations:', error)
    return []
  }

  return data || []
}

/**
 * Fetch locations by country
 */
export async function fetchLocationsByCountry(country: string, excludeId?: string, limit = 4) {
  const supabase = createSupabaseClient()
  
  let query = supabase
    .from('locations')
    .select(`
      id,
      name,
      slug,
      description,
      country,
      region,
      featured_image,
      rating,
      visit_count
    `)
    .eq('country', country)
    .order('visit_count', { ascending: false })
    .limit(limit)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching locations by country:', error)
    return []
  }

  return data || []
}

/**
 * Search locations
 */
export async function searchLocations(query: string, limit = 10) {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('locations')
    .select(`
      id,
      name,
      slug,
      description,
      country,
      region,
      featured_image,
      rating
    `)
    .or(`name.ilike.%${query}%,country.ilike.%${query}%,region.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(limit)

  if (error) {
    console.error('Error searching locations:', error)
    return []
  }

  return data || []
}

/**
 * Increment location visit count
 */
export async function incrementLocationVisits(locationId: string) {
  const supabase = createSupabaseClient()
  
  const { error } = await supabase.rpc('increment_location_visits', {
    location_id: locationId
  })

  if (error) {
    console.error('Error incrementing visits:', error)
  }
}

/**
 * Get location statistics
 */
export async function getLocationStats(locationId: string) {
  const supabase = createSupabaseClient()
  
  const [
    { count: restaurantCount },
    { count: activityCount }
  ] = await Promise.all([
    supabase
      .from('restaurants')
      .select('*', { count: 'exact', head: true })
      .eq('location_id', locationId)
      .eq('is_verified', true),
    supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .eq('location_id', locationId)
      .eq('is_verified', true)
  ])

  return {
    restaurants: restaurantCount || 0,
    activities: activityCount || 0,
    posts: 0
  }
}

