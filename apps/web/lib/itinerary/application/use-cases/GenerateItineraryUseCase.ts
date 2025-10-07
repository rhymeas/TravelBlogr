/**
 * Application Use Case: GenerateItineraryUseCase
 * Orchestrates the itinerary generation process
 * Follows Clean Architecture principles
 */

import { Itinerary } from '../../domain/entities/Itinerary'
import { LocationRepository } from '../../infrastructure/repositories/LocationRepository'
import { RouteCalculatorService } from '../services/RouteCalculatorService'
import { GroqAIService } from '../services/GroqAIService'

export interface GenerateItineraryCommand {
  from: string // location slug or name
  to: string // location slug or name
  stops?: string[] // optional middle stops (slugs or names)
  startDate: string // ISO date
  endDate: string // ISO date
  interests?: string[]
  budget?: 'budget' | 'moderate' | 'luxury'
}

export interface ResolvedLocation {
  userInput: string
  resolvedName: string
  country?: string
  region?: string
}

export interface GenerateItineraryResult {
  success: boolean
  itinerary?: Itinerary
  error?: string
  resolvedLocations?: ResolvedLocation[]
}

export class GenerateItineraryUseCase {
  private locationRepo: LocationRepository
  private routeCalculator: RouteCalculatorService
  private aiService: GroqAIService

  constructor() {
    this.locationRepo = new LocationRepository()
    this.routeCalculator = new RouteCalculatorService(this.locationRepo)
    this.aiService = new GroqAIService()
  }

  /**
   * Execute the use case
   */
  async execute(command: GenerateItineraryCommand): Promise<GenerateItineraryResult> {
    try {
      console.log('🚀 Starting itinerary generation:', command)

      // 1. Validate command
      this.validateCommand(command)

      // 2. Calculate route with user-specified stops
      console.log('🛣️ Calculating route...')
      const routeInfo = await this.routeCalculator.calculateRouteWithStops(
        command.from,
        command.to,
        command.stops || []
      )

      // 3. Calculate total days
      const totalDays = this.routeCalculator.calculateTotalDays(
        command.startDate,
        command.endDate
      )
      console.log(`📅 Total days: ${totalDays}`)

      // 4. Validate days vs route
      if (totalDays < 2) {
        return {
          success: false,
          error: 'Trip must be at least 2 days long'
        }
      }

      // Calculate minimum days: 1 day per location + travel days
      // More lenient: allow short trips if distance is small
      const travelDays = routeInfo.calculateTravelDays()
      const numLocations = 2 + routeInfo.stops.length // from + to + stops
      const minDaysNeeded = Math.max(2, numLocations + travelDays)

      if (totalDays < minDaysNeeded) {
        return {
          success: false,
          error: `This route requires at least ${minDaysNeeded} days (${numLocations} locations + ${travelDays} travel days). Please extend your trip or choose closer locations.`
        }
      }

      // 5. Fetch location data (activities & restaurants)
      console.log('📊 Fetching location data...')
      const locationSlugs = [
        command.from,
        ...routeInfo.stops.map(s => s.slug),
        command.to
      ]

      const locationsData = await this.fetchLocationsData(locationSlugs)

      if (locationsData.length === 0) {
        return {
          success: false,
          error: 'Could not fetch location data'
        }
      }

      // 6. Generate itinerary using AI
      console.log('🤖 Generating itinerary with AI...')
      const aiResult = await this.aiService.generateItinerary(
        {
          fromLocation: routeInfo.fromLocation,
          toLocation: routeInfo.toLocation,
          totalDays,
          routeDistance: routeInfo.distanceKm,
          routeDuration: routeInfo.estimatedDurationHours,
          stops: routeInfo.stops.map(s => s.name),
          interests: command.interests || [],
          budget: command.budget || 'moderate',
          locationsData
        },
        command.startDate
      )

      // 7. Create domain entity
      const itinerary = Itinerary.create({
        title: aiResult.title,
        summary: aiResult.summary,
        days: aiResult.days,
        totalCostEstimate: aiResult.totalCostEstimate,
        tips: aiResult.tips
      })

      // 8. Build resolved locations list for transparency
      const resolvedLocations: ResolvedLocation[] = [
        {
          userInput: command.from,
          resolvedName: routeInfo.fromLocation
        },
        ...routeInfo.stops.map((stop, index) => ({
          userInput: command.stops?.[index] || stop.name,
          resolvedName: stop.name
        })),
        {
          userInput: command.to,
          resolvedName: routeInfo.toLocation
        }
      ]

      console.log('✅ Itinerary generated successfully!')
      console.log('📍 Resolved locations:', resolvedLocations)

      return {
        success: true,
        itinerary,
        resolvedLocations
      }

    } catch (error) {
      console.error('❌ Error generating itinerary:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Validate command input
   */
  private validateCommand(command: GenerateItineraryCommand): void {
    if (!command.from || !command.to) {
      throw new Error('Origin and destination are required')
    }

    if (command.from === command.to) {
      throw new Error('Origin and destination must be different')
    }

    if (!command.startDate || !command.endDate) {
      throw new Error('Start and end dates are required')
    }

    const startDate = new Date(command.startDate)
    const endDate = new Date(command.endDate)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Invalid date format')
    }

    if (endDate < startDate) {
      throw new Error('End date must be after start date')
    }

    // Check if dates are in the past
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (startDate < today) {
      throw new Error('Start date cannot be in the past')
    }
  }

  /**
   * Fetch detailed data for all locations
   */
  private async fetchLocationsData(slugs: string[]) {
    const results = await Promise.all(
      slugs.map(slug => this.locationRepo.findBySlugWithDetails(slug))
    )

    return results
      .filter((result): result is NonNullable<typeof result> => result !== null)
      .map(result => ({
        name: result.location.name,
        slug: result.location.slug,
        activities: result.activities,
        restaurants: result.restaurants
      }))
  }
}

