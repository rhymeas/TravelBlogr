/**
 * Infrastructure: LocationRepository
 * Handles data access for locations, activities, and restaurants
 */

import { createClient } from '@supabase/supabase-js'
import { Coordinates } from '../../domain/value-objects/RouteInfo'

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export interface LocationData {
  id: string
  name: string
  slug: string
  country: string
  region: string
  latitude: number
  longitude: number
  rating?: number
  description?: string
}

export interface ActivityData {
  id: string
  name: string
  description?: string
  category?: string
  duration?: string
  price_info?: string
  rating?: number
  address?: string
  latitude?: number
  longitude?: number
}

export interface RestaurantData {
  id: string
  name: string
  cuisine_type?: string
  price_range?: string
  rating?: number
  address?: string
  latitude?: number
  longitude?: number
}

export class LocationRepository {
  /**
   * Get location by slug
   */
  async findBySlug(slug: string): Promise<LocationData | null> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('locations')
      .select('id, name, slug, country, region, latitude, longitude, rating, description')
      .eq('slug', slug)
      // Note: Not filtering by is_published for itinerary generation
      .single()

    if (error) {
      console.error('Error fetching location:', error)
      return null
    }

    return data
  }

  /**
   * Get location with activities and restaurants
   */
  async findBySlugWithDetails(slug: string): Promise<{
    location: LocationData
    activities: ActivityData[]
    restaurants: RestaurantData[]
  } | null> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('locations')
      .select(`
        id, name, slug, country, region, latitude, longitude, rating, description,
        activities (
          id, name, description, category, duration, price_info, rating, address, latitude, longitude
        ),
        restaurants (
          id, name, cuisine_type, price_range, rating, address, latitude, longitude
        )
      `)
      .eq('slug', slug)
      // Note: Not filtering by is_published for itinerary generation
      .single()

    if (error) {
      console.error('Error fetching location with details:', error)
      return null
    }

    return {
      location: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        country: data.country,
        region: data.region,
        latitude: data.latitude,
        longitude: data.longitude,
        rating: data.rating,
        description: data.description
      },
      activities: (data.activities || [])
        .filter((a: any) => a.is_verified !== false)
        .slice(0, 15), // Top 15 activities
      restaurants: (data.restaurants || [])
        .filter((r: any) => r.is_verified !== false)
        .slice(0, 10) // Top 10 restaurants
    }
  }

  /**
   * Find locations within bounding box (for route stops)
   */
  async findInBoundingBox(
    minLat: number,
    maxLat: number,
    minLng: number,
    maxLng: number,
    excludeIds: string[] = []
  ): Promise<LocationData[]> {
    const supabase = getSupabaseClient()
    let query = supabase
      .from('locations')
      .select('id, name, slug, country, region, latitude, longitude, rating')
      .gte('latitude', minLat)
      .lte('latitude', maxLat)
      .gte('longitude', minLng)
      .lte('longitude', maxLng)
      // Note: Not filtering by is_published for itinerary generation
      .order('rating', { ascending: false })
      .limit(10)

    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error finding locations in bounding box:', error)
      return []
    }

    return data || []
  }

  /**
   * Search locations by name
   */
  async search(query: string, limit: number = 10): Promise<LocationData[]> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('locations')
      .select('id, name, slug, country, region, latitude, longitude, rating')
      .or(`name.ilike.%${query}%,country.ilike.%${query}%,region.ilike.%${query}%`)
      .eq('is_published', true)
      .order('rating', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error searching locations:', error)
      return []
    }

    return data || []
  }

  /**
   * Calculate Haversine distance between two coordinates
   */
  calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371 // Earth radius in km
    const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180
    const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(coord1.latitude * Math.PI / 180) *
      Math.cos(coord2.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * Calculate detour distance (via point vs direct)
   */
  calculateDetour(
    start: Coordinates,
    end: Coordinates,
    via: Coordinates
  ): number {
    const directDistance = this.calculateDistance(start, end)
    const viaDistance = 
      this.calculateDistance(start, via) + 
      this.calculateDistance(via, end)
    return viaDistance - directDistance
  }
}

