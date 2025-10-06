/**
 * Simple, Fast, Free Itinerary Generator
 * No expensive AI needed - uses rule-based logic + your existing data
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface ItineraryRequest {
  from: string // Location name or slug
  to: string
  startDate: string
  endDate: string
  interests?: string[] // ['temples', 'food', 'nature']
  budget?: 'budget' | 'moderate' | 'luxury'
  pace?: 'relaxed' | 'moderate' | 'fast'
}

export interface DayPlan {
  day: number
  date: string
  location: string
  locationId: string
  type: 'stay' | 'travel'
  activities: Activity[]
  meals: Meal[]
  travelInfo?: TravelInfo
}

export class SimpleItineraryGenerator {
  /**
   * Generate complete itinerary - FAST and FREE!
   */
  async generate(request: ItineraryRequest): Promise<DayPlan[]> {
    console.log('🚀 Generating itinerary:', request)

    // 1. Get location data
    const fromLocation = await this.getLocation(request.from)
    const toLocation = await this.getLocation(request.to)

    if (!fromLocation || !toLocation) {
      throw new Error('Location not found')
    }

    // 2. Calculate days
    const days = this.calculateDays(request.startDate, request.endDate)
    console.log(`📅 Total days: ${days}`)

    // 3. Find stops along the route
    const stops = await this.findStopsAlongRoute(
      fromLocation,
      toLocation,
      days
    )
    console.log(`🛣️ Found ${stops.length} stops along the way`)

    // 4. Allocate days to each location
    const allocation = this.allocateDays(
      fromLocation,
      toLocation,
      stops,
      days
    )
    console.log('📊 Day allocation:', allocation)

    // 5. Generate daily plans
    const itinerary: DayPlan[] = []
    let currentDay = 1
    let currentDate = new Date(request.startDate)

    for (const alloc of allocation) {
      if (alloc.type === 'travel') {
        // Travel day
        itinerary.push({
          day: currentDay,
          date: currentDate.toISOString().split('T')[0],
          location: `${alloc.from} → ${alloc.to}`,
          locationId: alloc.toLocationId,
          type: 'travel',
          activities: [],
          meals: await this.selectMeals(alloc.toLocationId, request.budget, 1),
          travelInfo: {
            from: alloc.from,
            to: alloc.to,
            distance: alloc.distance,
            duration: alloc.duration,
            mode: 'train' // TODO: Calculate best mode
          }
        })
        currentDay++
        currentDate.setDate(currentDate.getDate() + 1)
      } else {
        // Stay days
        for (let i = 0; i < alloc.days; i++) {
          const activities = await this.selectActivities(
            alloc.locationId,
            request.interests || [],
            request.budget || 'moderate',
            request.pace || 'moderate'
          )

          const meals = await this.selectMeals(
            alloc.locationId,
            request.budget || 'moderate',
            1
          )

          itinerary.push({
            day: currentDay,
            date: currentDate.toISOString().split('T')[0],
            location: alloc.location,
            locationId: alloc.locationId,
            type: 'stay',
            activities,
            meals
          })

          currentDay++
          currentDate.setDate(currentDate.getDate() + 1)
        }
      }
    }

    console.log('✅ Itinerary generated!')
    return itinerary
  }

  /**
   * Get location from database
   */
  private async getLocation(nameOrSlug: string) {
    const { data } = await supabase
      .from('locations')
      .select('*')
      .or(`slug.eq.${nameOrSlug},name.ilike.%${nameOrSlug}%`)
      .eq('is_published', true)
      .single()

    return data
  }

  /**
   * Calculate number of days
   */
  private calculateDays(startDate: string, endDate: string): number {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }

  /**
   * Find interesting stops along the route
   */
  private async findStopsAlongRoute(
    from: any,
    to: any,
    totalDays: number
  ): Promise<any[]> {
    // Calculate bounding box
    const minLat = Math.min(from.latitude, to.latitude) - 1
    const maxLat = Math.max(from.latitude, to.latitude) + 1
    const minLng = Math.min(from.longitude, to.longitude) - 1
    const maxLng = Math.max(from.longitude, to.longitude) + 1

    // Query locations in between
    const { data: locations } = await supabase
      .from('locations')
      .select('*')
      .gte('latitude', minLat)
      .lte('latitude', maxLat)
      .gte('longitude', minLng)
      .lte('longitude', maxLng)
      .eq('is_published', true)
      .neq('id', from.id)
      .neq('id', to.id)
      .order('rating', { ascending: false })
      .limit(20)

    if (!locations) return []

    // Filter to locations actually on the route (not too much detour)
    const onRoute = locations.filter(loc => {
      const detour = this.calculateDetour(
        { lat: from.latitude, lng: from.longitude },
        { lat: to.latitude, lng: to.longitude },
        { lat: loc.latitude, lng: loc.longitude }
      )
      return detour < 100 // Less than 100km detour
    })

    // Limit stops based on available days
    const maxStops = Math.max(0, totalDays - 4) // Reserve 2 days for start/end
    return onRoute.slice(0, maxStops)
  }

  /**
   * Calculate detour distance
   */
  private calculateDetour(start: any, end: any, point: any): number {
    const directDistance = this.haversineDistance(start, end)
    const viaDistance = 
      this.haversineDistance(start, point) + 
      this.haversineDistance(point, end)
    return viaDistance - directDistance
  }

  /**
   * Haversine distance formula
   */
  private haversineDistance(coord1: any, coord2: any): number {
    const R = 6371 // Earth radius in km
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180
    const dLon = (coord2.lng - coord1.lng) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  /**
   * Allocate days to each location
   */
  private allocateDays(from: any, to: any, stops: any[], totalDays: number) {
    const allocation = []
    const distance = this.haversineDistance(
      { lat: from.latitude, lng: from.longitude },
      { lat: to.latitude, lng: to.longitude }
    )

    // Calculate travel days needed
    const travelDays = Math.ceil(distance / 300) // 300km per day
    const stayDays = totalDays - travelDays

    // Start location
    const startDays = Math.max(1, Math.floor(stayDays * 0.4))
    allocation.push({
      type: 'stay',
      location: from.name,
      locationId: from.id,
      days: startDays
    })

    // Stops
    stops.forEach(stop => {
      allocation.push({
        type: 'travel',
        from: allocation[allocation.length - 1].location,
        to: stop.name,
        toLocationId: stop.id,
        distance: 0, // TODO: Calculate
        duration: 0
      })
      allocation.push({
        type: 'stay',
        location: stop.name,
        locationId: stop.id,
        days: 1
      })
    })

    // Travel to end
    allocation.push({
      type: 'travel',
      from: allocation[allocation.length - 1].location,
      to: to.name,
      toLocationId: to.id,
      distance: 0,
      duration: 0
    })

    // End location
    const endDays = Math.max(1, totalDays - allocation.reduce((sum, a) => 
      sum + (a.type === 'stay' ? a.days : 1), 0
    ))
    allocation.push({
      type: 'stay',
      location: to.name,
      locationId: to.id,
      days: endDays
    })

    return allocation
  }

  /**
   * Select activities for a location
   */
  private async selectActivities(
    locationId: string,
    interests: string[],
    budget: string,
    pace: string
  ) {
    // Fetch activities
    let query = supabase
      .from('activities')
      .select('*')
      .eq('location_id', locationId)
      .order('rating', { ascending: false })
      .limit(50)

    const { data: activities } = await query

    if (!activities || activities.length === 0) return []

    // Filter by interests
    let filtered = activities
    if (interests.length > 0) {
      filtered = activities.filter(a => 
        interests.some(interest => 
          a.category?.toLowerCase().includes(interest.toLowerCase()) ||
          a.description?.toLowerCase().includes(interest.toLowerCase()) ||
          a.name?.toLowerCase().includes(interest.toLowerCase())
        )
      )
    }

    // If no matches, use all
    if (filtered.length === 0) filtered = activities

    // Select based on pace
    const count = pace === 'relaxed' ? 3 : pace === 'fast' ? 6 : 4
    return filtered.slice(0, count)
  }

  /**
   * Select meals for a location
   */
  private async selectMeals(
    locationId: string,
    budget: string,
    days: number
  ) {
    const { data: restaurants } = await supabase
      .from('restaurants')
      .select('*')
      .eq('location_id', locationId)
      .order('rating', { ascending: false })
      .limit(20)

    if (!restaurants || restaurants.length === 0) return []

    // Filter by budget
    const budgetMap = {
      budget: ['$', '$$'],
      moderate: ['$$', '$$$'],
      luxury: ['$$$', '$$$$']
    }
    const filtered = restaurants.filter(r => 
      budgetMap[budget].includes(r.price_range)
    )

    // Select 3 meals per day
    const meals = []
    for (let i = 0; i < days * 3; i++) {
      const restaurant = filtered[i % filtered.length]
      meals.push({
        type: i % 3 === 0 ? 'breakfast' : i % 3 === 1 ? 'lunch' : 'dinner',
        restaurant
      })
    }

    return meals
  }
}

