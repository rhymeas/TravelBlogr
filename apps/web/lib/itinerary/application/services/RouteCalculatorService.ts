/**
 * Application Service: RouteCalculatorService
 * Calculates routes and finds stops between locations
 */

import { RouteInfo, StopLocation } from '../../domain/value-objects/RouteInfo'
import { LocationRepository } from '../../infrastructure/repositories/LocationRepository'
import { LocationDiscoveryService } from '../../infrastructure/services/LocationDiscoveryService'

export class RouteCalculatorService {
  private discoveryService: LocationDiscoveryService

  constructor(private locationRepo: LocationRepository) {
    this.discoveryService = new LocationDiscoveryService()
  }

  /**
   * Calculate route with user-specified stops
   */
  async calculateRouteWithStops(
    fromSlug: string,
    toSlug: string,
    stopSlugs: string[]
  ): Promise<RouteInfo> {
    console.log(`🛣️ Calculating route: ${fromSlug} → ${stopSlugs.join(' → ')} → ${toSlug}`)

    // 1. Find or create all locations
    const [fromLocation, toLocation, ...stopLocations] = await Promise.all([
      this.discoveryService.findOrCreateLocation(fromSlug),
      this.discoveryService.findOrCreateLocation(toSlug),
      ...stopSlugs.map(slug => this.discoveryService.findOrCreateLocation(slug))
    ])

    if (!fromLocation) {
      throw new Error(`Could not find or create origin location: ${fromSlug}`)
    }

    if (!toLocation) {
      throw new Error(`Could not find or create destination location: ${toSlug}`)
    }

    // Filter out any null stops
    const validStops = stopLocations.filter(loc => loc !== null)

    console.log(`✅ Locations resolved: ${fromLocation.name} → ${validStops.map(s => s!.name).join(' → ')} → ${toLocation.name}`)

    // 2. Calculate total distance through all stops
    const allLocations = [fromLocation, ...validStops, toLocation]
    let totalDistance = 0

    for (let i = 0; i < allLocations.length - 1; i++) {
      const dist = this.locationRepo.calculateDistance(
        { latitude: allLocations[i]!.latitude, longitude: allLocations[i]!.longitude },
        { latitude: allLocations[i + 1]!.latitude, longitude: allLocations[i + 1]!.longitude }
      )
      totalDistance += dist
    }

    // 3. Convert stops to StopLocation format
    const stops: StopLocation[] = validStops.map(stop => ({
      name: stop!.name,
      slug: stop!.slug,
      latitude: stop!.latitude,
      longitude: stop!.longitude
    }))

    // 4. Estimate travel duration (average 60 km/h)
    const estimatedDuration = totalDistance / 60

    return new RouteInfo(
      fromLocation.name,
      toLocation.name,
      totalDistance,
      estimatedDuration,
      stops
    )
  }

  /**
   * Calculate route from origin to destination (legacy - auto-finds stops)
   * Now supports ANY location - will auto-create if not in database
   */
  async calculateRoute(
    fromSlug: string,
    toSlug: string,
    maxStops: number = 3
  ): Promise<RouteInfo> {
    console.log(`🛣️ Calculating route: ${fromSlug} → ${toSlug}`)

    // 1. Find or create origin and destination locations
    const [fromLocation, toLocation] = await Promise.all([
      this.discoveryService.findOrCreateLocation(fromSlug),
      this.discoveryService.findOrCreateLocation(toSlug)
    ])

    if (!fromLocation) {
      throw new Error(`Could not find or create origin location: ${fromSlug}. Please check the spelling or try a different location.`)
    }

    if (!toLocation) {
      throw new Error(`Could not find or create destination location: ${toSlug}. Please check the spelling or try a different location.`)
    }

    console.log(`✅ Locations resolved: ${fromLocation.name} → ${toLocation.name}`)

    // 2. Calculate direct distance
    const distance = this.locationRepo.calculateDistance(
      { latitude: fromLocation.latitude, longitude: fromLocation.longitude },
      { latitude: toLocation.latitude, longitude: toLocation.longitude }
    )

    // 3. Find potential stops along the route
    const stops = await this.findStopsAlongRoute(
      fromLocation,
      toLocation,
      maxStops
    )

    // 4. Estimate travel duration (average 60 km/h)
    const estimatedDuration = distance / 60

    return new RouteInfo(
      fromLocation.name,
      toLocation.name,
      distance,
      estimatedDuration,
      stops
    )
  }

  /**
   * Find interesting stops along the route
   */
  private async findStopsAlongRoute(
    from: any,
    to: any,
    maxStops: number
  ): Promise<StopLocation[]> {
    // Calculate bounding box with some padding
    const padding = 0.5 // degrees (~55km)
    const minLat = Math.min(from.latitude, to.latitude) - padding
    const maxLat = Math.max(from.latitude, to.latitude) + padding
    const minLng = Math.min(from.longitude, to.longitude) - padding
    const maxLng = Math.max(from.longitude, to.longitude) + padding

    // Find locations in bounding box
    const candidates = await this.locationRepo.findInBoundingBox(
      minLat,
      maxLat,
      minLng,
      maxLng,
      [from.id, to.id]
    )

    // Filter to locations that are actually on the route (< 50km detour)
    const validStops: StopLocation[] = []

    for (const candidate of candidates) {
      const detour = this.locationRepo.calculateDetour(
        { latitude: from.latitude, longitude: from.longitude },
        { latitude: to.latitude, longitude: to.longitude },
        { latitude: candidate.latitude, longitude: candidate.longitude }
      )

      if (detour < 50) {
        validStops.push({
          id: candidate.id,
          name: candidate.name,
          slug: candidate.slug,
          coordinates: {
            latitude: candidate.latitude,
            longitude: candidate.longitude
          },
          detourKm: detour,
          rating: candidate.rating
        })
      }
    }

    // Sort by rating and limit to maxStops
    return validStops
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, maxStops)
  }

  /**
   * Calculate total days needed for route
   */
  calculateTotalDays(
    startDate: string,
    endDate: string
  ): number {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays + 1 // Include both start and end day
  }

  /**
   * Allocate days to locations based on route
   */
  allocateDays(
    totalDays: number,
    routeInfo: RouteInfo
  ): Array<{ location: string; slug?: string; days: number; type: 'stay' | 'travel' }> {
    const allocation: Array<{ location: string; slug?: string; days: number; type: 'stay' | 'travel' }> = []
    
    // Calculate travel days needed
    const travelDays = routeInfo.calculateTravelDays()
    const stayDays = totalDays - travelDays

    if (stayDays < 2) {
      throw new Error('Not enough days for this route. Need at least 2 stay days.')
    }

    // Allocate days
    const numStops = routeInfo.stops.length
    const locationsCount = 2 + numStops // origin + destination + stops

    // Simple allocation: divide stay days among locations
    const daysPerLocation = Math.floor(stayDays / locationsCount)
    const extraDays = stayDays % locationsCount

    // Origin gets more days
    allocation.push({
      location: routeInfo.fromLocation,
      days: daysPerLocation + Math.floor(extraDays / 2),
      type: 'stay'
    })

    // Stops get standard allocation
    routeInfo.stops.forEach(stop => {
      allocation.push({
        location: stop.name,
        slug: stop.slug,
        days: Math.max(1, daysPerLocation),
        type: 'stay'
      })
    })

    // Destination gets remaining days
    allocation.push({
      location: routeInfo.toLocation,
      days: daysPerLocation + Math.ceil(extraDays / 2),
      type: 'stay'
    })

    return allocation
  }
}

