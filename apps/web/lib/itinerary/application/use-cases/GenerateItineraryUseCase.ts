/**
 * Application Use Case: GenerateplanUseCase
 * Orchestrates the plan generation process
 * Follows Clean Architecture principles
 *
 * Features intelligent database-backed caching to reduce Groq API calls
 */

import { plan as Plan } from '../../domain/entities/Itinerary'
import { LocationRepository } from '../../infrastructure/repositories/LocationRepository'
import { RouteCalculatorService } from '../services/RouteCalculatorService'
import { GroqAIService } from '../services/GroqAIService'
import { cachedItineraryRepository, CacheKey } from '../../infrastructure/repositories/CachedItineraryRepository'

export interface GenerateplanCommand {
  from: string // location slug or name
  to: string // location slug or name
  stops?: string[] // optional middle stops (slugs or names)
  startDate: string // ISO date
  endDate: string // ISO date
  interests?: string[]
  budget?: 'budget' | 'moderate' | 'luxury'
  maxTravelHoursPerDay?: number // Optional: max travel hours per day (e.g., 4)
  forceRefresh?: boolean // Force regeneration, bypass cache
}

export interface ResolvedLocation {
  userInput: string
  resolvedName: string
  country?: string
  region?: string
}

export interface GenerateplanResult {
  success: boolean
  plan?: Plan
  error?: string
  resolvedLocations?: ResolvedLocation[]
  locationImages?: Record<string, string> // Map of location name to featured image URL
}

export class GenerateplanUseCase {
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
  async execute(command: GenerateplanCommand): Promise<GenerateplanResult> {
    try {
      console.log('🚀 Starting plan generation:', command)

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
      // Removed restrictive validation - users should be free to plan trips of any duration
      // The AI will adapt the itinerary to fit the available time

      // 5. Check cache (unless force refresh requested)
      if (!command.forceRefresh) {
        const cacheParams: CacheKey = {
          fromLocation: routeInfo.fromLocation,
          toLocation: routeInfo.toLocation,
          stops: routeInfo.stops.map(s => s.name),
          totalDays,
          interests: command.interests || [],
          budget: command.budget || 'moderate'
        }

        // Try exact match first
        console.log('🔍 Checking cache for exact match...')
        let cachedPlan = await cachedItineraryRepository.findByExactMatch(cacheParams)

        // If no exact match, try similar plans
        if (!cachedPlan) {
          console.log('🔍 Checking cache for similar plans...')
          cachedPlan = await cachedItineraryRepository.findSimilar(cacheParams)
        }

        // If cache hit, return cached plan
        if (cachedPlan) {
          console.log(`⚡ Cache hit! Returning cached plan (used ${cachedPlan.usageCount} times)`)

          // Create Plan entity from cached data
          const plan = Plan.create({
            title: cachedPlan.planData.title,
            summary: cachedPlan.planData.summary,
            days: cachedPlan.planData.days,
            totalCostEstimate: cachedPlan.planData.totalCostEstimate,
            tips: cachedPlan.planData.tips
          })

          // Fetch location images even for cached plans
          console.log('🖼️ Fetching location images for cached plan...')
          const locationImages = await this.locationRepo.getLocationImages([
            routeInfo.fromLocation,
            ...routeInfo.stops.map(s => s.name),
            routeInfo.toLocation
          ])

          // Build resolved locations
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

          return {
            success: true,
            plan,
            resolvedLocations,
            locationImages
          }
        }

        console.log('❌ Cache miss - generating new plan with AI')
      } else {
        console.log('🔄 Force refresh requested - bypassing cache')
      }

      // 6. Fetch location data (activities & restaurants)
      console.log('📊 Fetching location data...')
      const locationSlugs = [
        routeInfo.fromSlug || command.from, // Use slug from routeInfo if available
        ...routeInfo.stops.map(s => s.slug),
        routeInfo.toSlug || command.to      // Use slug from routeInfo if available
      ]

      console.log('🔍 Fetching data for slugs:', locationSlugs)
      const locationsData = await this.fetchLocationsData(locationSlugs)

      if (locationsData.length === 0) {
        console.error('❌ No location data found for slugs:', locationSlugs)
        return {
          success: false,
          error: 'Could not fetch location data'
        }
      }

      // 7. Generate plan using AI
      console.log('🤖 Generating plan with AI...')
      const aiResult = await this.aiService.generateplan(
        {
          fromLocation: routeInfo.fromLocation,
          toLocation: routeInfo.toLocation,
          totalDays,
          routeDistance: routeInfo.distanceKm,
          routeDuration: routeInfo.estimatedDurationHours,
          stops: routeInfo.stops.map(s => s.name),
          interests: command.interests || [],
          budget: command.budget || 'moderate',
          maxTravelHoursPerDay: command.maxTravelHoursPerDay, // Pass travel pacing preference
          locationsData
        },
        command.startDate
      )

      // 8. PROFESSIONAL INTEGRATION: Enrich locations with AI metadata
      console.log('🌍 Enriching locations with AI metadata...')
      await this.enrichLocationsWithAIMetadata(aiResult.days)

      // 9. Create domain entity
      const plan = Plan.create({
        title: aiResult.title,
        summary: aiResult.summary,
        days: aiResult.days,
        totalCostEstimate: aiResult.totalCostEstimate,
        tips: aiResult.tips
      })

      // 10. Save to cache for future reuse
      console.log('💾 Saving plan to cache...')
      const cacheParams: CacheKey = {
        fromLocation: routeInfo.fromLocation,
        toLocation: routeInfo.toLocation,
        stops: routeInfo.stops.map(s => s.name),
        totalDays,
        interests: command.interests || [],
        budget: command.budget || 'moderate'
      }

      await cachedItineraryRepository.save(cacheParams, {
        title: aiResult.title,
        summary: aiResult.summary,
        days: aiResult.days,
        totalCostEstimate: aiResult.totalCostEstimate,
        tips: aiResult.tips
      }).catch(error => {
        // Don't fail the request if caching fails
        console.error('⚠️ Failed to cache plan:', error)
      })

      // 10. Fetch location images from database
      console.log('🖼️ Fetching location images...')
      const locationImages = await this.locationRepo.getLocationImages([
        routeInfo.fromLocation,
        ...routeInfo.stops.map(s => s.name),
        routeInfo.toLocation
      ])

      // 11. Build resolved locations list for transparency
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

      console.log('✅ plan generated successfully!')
      console.log('📍 Resolved locations:', resolvedLocations)
      console.log(`🖼️ Fetched ${Object.keys(locationImages).length} location images`)

      return {
        success: true,
        plan,
        resolvedLocations,
        locationImages
      }

    } catch (error) {
      console.error('❌ Error generating plan:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Validate command input
   */
  private validateCommand(command: GenerateplanCommand): void {
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
      slugs.map(async (slug) => {
        const result = await this.locationRepo.findBySlugWithDetails(slug)
        if (!result) {
          console.error(`⚠️ Could not find location data for slug: "${slug}"`)
        }
        return result
      })
    )

    const validResults = results.filter((result): result is NonNullable<typeof result> => result !== null)
    console.log(`✅ Found ${validResults.length}/${slugs.length} locations with data`)

    return validResults.map(result => ({
      name: result.location.name,
      slug: result.location.slug,
      activities: result.activities,
      restaurants: result.restaurants
    }))
  }

  /**
   * PROFESSIONAL INTEGRATION: Enrich locations with AI-provided metadata
   * Updates database with continent, region data from AI
   */
  private async enrichLocationsWithAIMetadata(days: any[]) {
    const { LocationDiscoveryService } = await import('../../infrastructure/services/LocationDiscoveryService')
    const discoveryService = new LocationDiscoveryService()

    // Extract unique locations with their metadata from AI response
    const locationMetadataMap = new Map<string, any>()

    for (const day of days) {
      if (day.locationMetadata) {
        const locationName = day.location || day.locationMetadata.name
        if (!locationMetadataMap.has(locationName)) {
          locationMetadataMap.set(locationName, day.locationMetadata)
          console.log(`🤖 AI metadata for ${locationName}:`, day.locationMetadata)
        }
      }
    }

    // Enrich each location with AI metadata
    for (const [locationName, metadata] of Array.from(locationMetadataMap.entries())) {
      try {
        await discoveryService.findOrCreateLocationWithMetadata(locationName, metadata)
        console.log(`✅ Enriched ${locationName} with AI metadata`)
      } catch (error) {
        console.error(`⚠️ Failed to enrich ${locationName}:`, error)
        // Don't fail the entire request if one location fails
      }
    }

    console.log(`✅ Enriched ${locationMetadataMap.size} locations with AI metadata`)
  }
}

