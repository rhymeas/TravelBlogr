/**
 * Trip Enrichment Service
 * 
 * Fetches real coordinates from locations database and enriches trip data with:
 * - Real location coordinates
 * - Route data (geometry, distance, duration)
 * - Elevation profiles
 * - Points of interest along the route
 */

import { createServerSupabase } from '@/lib/supabase-server'
import { getRouteWithElevation } from './elevationService'
import { geocodeLocation } from './geocodingService'

export interface EnrichedLocation {
  id: string
  dayNumber: number
  title: string
  description: string
  latitude: number
  longitude: number
  locationName: string
  activities: string[]
  tips: string | null
  routeToNext?: {
    geometry: any
    distance: number
    duration: number
    elevationProfile?: {
      elevations: number[]
      distances: number[]
      ascent: number
      descent: number
      maxElevation: number
      minElevation: number
    }
  }
}

/**
 * Fetch coordinates for a location from the database or geocoding API
 */
async function fetchLocationCoordinates(
  locationName: string
): Promise<{ lat: number; lng: number; name: string } | null> {
  try {
    const supabase = await createServerSupabase()
    
    // First, try to find in locations database
    const { data: location } = await supabase
      .from('locations')
      .select('name, latitude, longitude')
      .ilike('name', `%${locationName}%`)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(1)
      .single()
    
    if (location && location.latitude && location.longitude) {
      return {
        lat: Number(location.latitude),
        lng: Number(location.longitude),
        name: location.name
      }
    }
    
    // If not found, use geocoding service
    const geocoded = await geocodeLocation(locationName)
    if (geocoded) {
      return {
        lat: geocoded.lat,
        lng: geocoded.lng,
        name: geocoded.displayName || locationName
      }
    }
    
    return null
  } catch (error) {
    console.error(`Error fetching coordinates for ${locationName}:`, error)
    return null
  }
}

/**
 * Enrich trip guide days with real coordinates and route data
 */
export async function enrichTripWithRouteData(
  guideId: string
): Promise<EnrichedLocation[]> {
  try {
    const supabase = await createServerSupabase()
    
    // Fetch guide days
    const { data: days, error } = await supabase
      .from('sample_guide_days')
      .select('*')
      .eq('guide_id', guideId)
      .order('day_number', { ascending: true })
    
    if (error || !days) {
      console.error('Error fetching guide days:', error)
      return []
    }
    
    const enrichedLocations: EnrichedLocation[] = []
    
    // Process each day
    for (let i = 0; i < days.length; i++) {
      const day = days[i]
      
      // Check if coordinates already exist in database
      let coordinates = null
      if (day.latitude && day.longitude) {
        coordinates = {
          lat: Number(day.latitude),
          lng: Number(day.longitude),
          name: day.location_name || day.title
        }
      } else {
        // Fetch coordinates
        coordinates = await fetchLocationCoordinates(day.title)
        
        // Update database with fetched coordinates
        if (coordinates) {
          await supabase
            .from('sample_guide_days')
            .update({
              latitude: coordinates.lat,
              longitude: coordinates.lng,
              location_name: coordinates.name
            })
            .eq('id', day.id)
        }
      }
      
      if (!coordinates) {
        console.warn(`Could not find coordinates for: ${day.title}`)
        continue
      }
      
      const enrichedLocation: EnrichedLocation = {
        id: day.id,
        dayNumber: day.day_number,
        title: day.title,
        description: day.description,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        locationName: coordinates.name,
        activities: day.activities || [],
        tips: day.tips
      }
      
      // Fetch route to next location
      if (i < days.length - 1) {
        const nextDay = days[i + 1]
        let nextCoordinates = null
        
        if (nextDay.latitude && nextDay.longitude) {
          nextCoordinates = {
            lat: Number(nextDay.latitude),
            lng: Number(nextDay.longitude)
          }
        } else {
          nextCoordinates = await fetchLocationCoordinates(nextDay.title)
        }
        
        if (nextCoordinates) {
          // Check if route data already exists
          if (day.route_to_next && day.distance_to_next && day.duration_to_next) {
            enrichedLocation.routeToNext = {
              geometry: day.route_to_next,
              distance: Number(day.distance_to_next),
              duration: Number(day.duration_to_next),
              elevationProfile: day.elevation_data as any
            }
          } else {
            // Fetch route with elevation data
            const routeData = await getRouteWithElevation(
              [coordinates.lng, coordinates.lat],
              [nextCoordinates.lng, nextCoordinates.lat]
            )
            
            if (routeData) {
              enrichedLocation.routeToNext = {
                geometry: routeData.geometry,
                distance: routeData.distance,
                duration: routeData.duration,
                elevationProfile: routeData.elevationProfile
              }
              
              // Update database with route data
              await supabase
                .from('sample_guide_days')
                .update({
                  route_to_next: routeData.geometry,
                  distance_to_next: routeData.distance,
                  duration_to_next: routeData.duration,
                  elevation_data: routeData.elevationProfile
                })
                .eq('id', day.id)
            }
          }
        }
      }
      
      enrichedLocations.push(enrichedLocation)
    }
    
    return enrichedLocations
  } catch (error) {
    console.error('Error enriching trip with route data:', error)
    return []
  }
}

/**
 * Get trip route summary statistics
 */
export async function getTripRouteSummary(guideId: string) {
  try {
    const supabase = await createServerSupabase()
    
    const { data, error } = await supabase
      .from('trip_route_summary')
      .select('*')
      .eq('guide_id', guideId)
      .single()
    
    if (error) {
      console.error('Error fetching trip route summary:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error in getTripRouteSummary:', error)
    return null
  }
}

/**
 * Clear cached route data for a trip (useful for re-fetching)
 */
export async function clearTripRouteCache(guideId: string): Promise<boolean> {
  try {
    const supabase = await createServerSupabase()
    
    const { error } = await supabase
      .from('sample_guide_days')
      .update({
        route_to_next: null,
        distance_to_next: null,
        duration_to_next: null,
        elevation_data: null
      })
      .eq('guide_id', guideId)
    
    if (error) {
      console.error('Error clearing route cache:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error in clearTripRouteCache:', error)
    return false
  }
}

