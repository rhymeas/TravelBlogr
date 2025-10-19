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
import { EnhancedGroqAIService } from '../services/EnhancedGroqAIService'
import { getCachedItineraryRepository, CacheKey } from '../../infrastructure/repositories/CachedItineraryRepository'

export interface GenerateplanCommand {
  from: string // location slug or name
  to: string // location slug or name
  stops?: string[] // optional middle stops (slugs or names)
  startDate: string // ISO date
  endDate: string // ISO date
  interests?: string[]
  budget?: 'budget' | 'moderate' | 'luxury'
  maxTravelHoursPerDay?: number // Optional: max travel hours per day (e.g., 4)
  transportMode?: 'car' | 'train' | 'bike' | 'flight' | 'bus' | 'mixed' // Transport mode
  proMode?: boolean // Enable Pro mode with reasoning AI
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
  locationImages?: Record<string, { featured: string; gallery: string[] }> // Map of location name to image data with gallery
  // NEW: structured context (routing, POIs, etc.) surfaced to API
  structuredContext?: any
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
        const cacheRepo = getCachedItineraryRepository()
        let cachedPlan = await cacheRepo.findByExactMatch(cacheParams)

        // If no exact match, try similar plans
        if (!cachedPlan) {
          console.log('🔍 Checking cache for similar plans...')
          cachedPlan = await cacheRepo.findSimilar(cacheParams)
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

          // Fetch location images even for cached plans WITH GALLERY SUPPORT
          console.log('🖼️ Fetching location images with galleries for cached plan...')
          const locationImages = await this.locationRepo.getLocationImagesWithGallery([
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

      // 6. Fetch location data (activities & restaurants) from DATABASE
      console.log('📊 Fetching location data from database...')
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

      // 6.2. Pre-compute structured context (routing + POIs) to maximize realism and enable DB reuse
      let structuredContext: any = {}
      try {
        const fromSlug = routeInfo.fromSlug || command.from
        const toSlug = routeInfo.toSlug || command.to

        // Build quick lookup
        const bySlug = new Map(locationsData.map(ld => [ld.slug, ld]))

        // Coordinates list in travel order
        const coords: Array<{ longitude: number; latitude: number }> = []
        const fromLoc = bySlug.get(fromSlug)
        if (fromLoc?.longitude && fromLoc?.latitude) {
          coords.push({ longitude: fromLoc.longitude, latitude: fromLoc.latitude })
        }
        for (const s of routeInfo.stops) {
          const stop = bySlug.get(s.slug)
          if (stop?.longitude && stop?.latitude) {
            coords.push({ longitude: stop.longitude, latitude: stop.latitude })
          } else if (s.coordinates) {
            coords.push({ longitude: s.coordinates.longitude, latitude: s.coordinates.latitude })
          }
        }
        const toLoc = bySlug.get(toSlug)
        if (toLoc?.longitude && toLoc?.latitude) {
          coords.push({ longitude: toLoc.longitude, latitude: toLoc.latitude })
        }

        // Compute routing (cached via DB providers)
        if (coords.length >= 2) {
          const { getRoute } = await import('../../../services/routingService')
          const profile = ((): 'driving-car' | 'cycling-regular' | 'foot-walking' | 'wheelchair' => {
            switch (command.transportMode) {
              case 'bike':
                return 'cycling-regular'
              case 'train':
              case 'bus':
              case 'car':
              case 'mixed':
              default:
                return 'driving-car'
            }
          })()
          const route = await getRoute(coords as any, profile)

          // Extract geometry coordinates (handle both GeoJSON and plain array)
          const routeGeometry = Array.isArray(route.geometry)
            ? route.geometry
            : route.geometry.coordinates

          structuredContext.routing = {
            distanceKm: route.distance / 1000,
            durationHours: route.duration / 3600,
            provider: route.provider,
            geometry: route.geometry // GeoJSON LineString [lng, lat] pairs
          }

          // NEW: Route Segmentation (if maxTravelHoursPerDay specified)
          if (command.maxTravelHoursPerDay && command.maxTravelHoursPerDay > 0) {
            console.log(`🗺️ Segmenting route by ${command.maxTravelHoursPerDay}h/day...`)
            const { segmentRouteByDrivingTime, calculateOvernightStops } = await import('../../../services/routeSegmentationService')

            try {
              const segments = segmentRouteByDrivingTime({
                routeGeometry: routeGeometry,
                totalDistanceKm: route.distance / 1000,
                totalDurationHours: route.duration / 3600,
                maxDrivingHoursPerDay: command.maxTravelHoursPerDay,
                startDate: command.startDate,
                startTime: '09:00', // Default departure time
                locations: locationsData.map(loc => ({
                  name: loc.name,
                  coordinates: [loc.longitude, loc.latitude] as [number, number]
                }))
              })

              const overnightStops = calculateOvernightStops(segments)

              structuredContext.routeSegments = segments
              structuredContext.overnightStops = overnightStops

              console.log(`✅ Created ${segments.length} route segments with ${overnightStops.length} overnight stops`)
            } catch (error) {
              console.error('⚠️ Failed to segment route:', error)
              structuredContext.routeSegments = []
              structuredContext.overnightStops = []
            }
          }

          // NEW: Gather comprehensive trip data from ALL sources
          console.log('🔍 Gathering comprehensive trip data from ALL sources...')
          const { isFeatureEnabled } = await import('../../../featureFlags')
          const { gatherComprehensiveTripData } = await import('../../../services/comprehensiveTripDataService')
          const {
            compressTripDataForAI,
            formatCompressedDataForAI,
            fitsWithinTokenLimit,
            compressTripDataForStorage
          } = await import('../../../services/tripDataCompressor')

          let comprehensiveData
          let compressedData
          let aiFormattedData

          try {
            // 1. Gather comprehensive data (with smart caching if enabled)
            if (isFeatureEnabled('SMART_POI_SYSTEM')) {
              const { smartFetch } = await import('../../../services/smartDataHandler')

              comprehensiveData = await smartFetch(
                `trip_data_${routeInfo.fromLocation}_${routeInfo.toLocation}`,
                'pois',
                async () => {
                  return await gatherComprehensiveTripData(
                    routeInfo.fromLocation,
                    routeInfo.toLocation,
                    routeGeometry,
                    route.distance / 1000,
                    route.duration / 3600
                  )
                },
                { useServerClient: true }
              )
            } else {
              // Fallback: Direct fetch without caching
              comprehensiveData = await gatherComprehensiveTripData(
                routeInfo.fromLocation,
                routeInfo.toLocation,
                routeGeometry,
                route.distance / 1000,
                route.duration / 3600
              )
            }

            console.log('✅ Comprehensive data gathered:')
            console.log(`   Total POIs: ${comprehensiveData.pois.total}`)
            console.log(`   Activities: ${comprehensiveData.activities.length}`)
            console.log(`   Restaurants: ${comprehensiveData.restaurants.length}`)
            console.log(`   Facts: ${comprehensiveData.facts.length}`)

            // 2. Compress data for AI processing
            compressedData = compressTripDataForAI(comprehensiveData)

            // 3. Format for AI prompt
            aiFormattedData = formatCompressedDataForAI(
              compressedData,
              command.transportMode || 'car',
              totalDays,
              command.interests || []
            )

            // 4. Check token limit
            if (!fitsWithinTokenLimit(aiFormattedData, 6000)) {
              console.warn('⚠️ Compressed data still too large, using fallback')
              aiFormattedData = null
            }

            // 5. Store compressed version in context (for database)
            structuredContext.comprehensiveData = compressTripDataForStorage(comprehensiveData)
            structuredContext.compressedData = compressedData
            structuredContext.aiFormattedData = aiFormattedData

          } catch (error) {
            console.error('⚠️ Failed to gather comprehensive data:', error)
          }

          // FALLBACK: Also fetch POIs using the old method for redundancy
          console.log('🗺️ Fetching POIs along route (fallback method)...')
          const {
            fetchPOIsAlongRoute,
            filterPOIsByDistance,
            getTopPOIs,
            enrichPOIsWithDetourTime,
            getWorthwhilePOIs,
            getQuickStops,
            getMealBreaks,
            getMajorAttractions,
            getHighlyRankedPOIs
          } = await import('../../../services/routePOIService')

          try {
            let allRoutePOIs

            // Use smart caching for POI fetching if enabled
            if (isFeatureEnabled('SMART_POI_SYSTEM')) {
              const { smartFetch } = await import('../../../services/smartDataHandler')

              allRoutePOIs = await smartFetch(
                `route_pois_${routeInfo.fromLocation}_${routeInfo.toLocation}`,
                'pois',
                async () => {
                  return await fetchPOIsAlongRoute(
                    routeGeometry,
                    150,
                    15,
                    ['interesting_places', 'tourist_facilities', 'natural', 'foods']
                  )
                },
                { useServerClient: true, apiName: 'opentripmap' }
              )
            } else {
              // Fallback: Direct fetch
              allRoutePOIs = await fetchPOIsAlongRoute(
                routeGeometry,
                150,
                15,
                ['interesting_places', 'tourist_facilities', 'natural', 'foods']
              )
            }

            const nearbyPOIs = filterPOIsByDistance(allRoutePOIs, 10) // Within 10km of route (increased from 5km)
            const topPOIs = getTopPOIs(nearbyPOIs, 50) // Top 50 POIs (increased from 30)

            // NEW: Enrich POIs with detour time calculations
            console.log('⏱️ Calculating detour times for POIs...')
            // Map transport mode to detour calculation mode
            const detourMode = profile === 'wheelchair' ? 'foot-walking' : profile
            const enrichedPOIs = await enrichPOIsWithDetourTime(
              topPOIs,
              routeGeometry,
              command.interests || [],
              detourMode
            )

            // Filter to only worthwhile POIs (< 15 min detour)
            const worthwhilePOIs = getWorthwhilePOIs(enrichedPOIs, 15)

            // Categorize by micro-experience
            const quickStops = getQuickStops(worthwhilePOIs)
            const mealBreaks = getMealBreaks(worthwhilePOIs)
            const majorAttractions = getMajorAttractions(worthwhilePOIs)

            // Get highly ranked POIs (score >= 70)
            const topRankedPOIs = getHighlyRankedPOIs(worthwhilePOIs)

            structuredContext.poisAlongRoute = enrichedPOIs
            structuredContext.worthwhilePOIs = worthwhilePOIs
            structuredContext.quickStops = quickStops
            structuredContext.mealBreaks = mealBreaks
            structuredContext.majorAttractions = majorAttractions
            structuredContext.topRankedPOIs = topRankedPOIs

            console.log(`✅ Found ${enrichedPOIs.length} POIs along route`)
            console.log(`✅ ${worthwhilePOIs.length} POIs worth the detour`)
            console.log(`   - ${quickStops.length} quick stops`)
            console.log(`   - ${mealBreaks.length} meal breaks`)
            console.log(`   - ${majorAttractions.length} major attractions`)
            console.log(`   - ${topRankedPOIs.length} highly ranked (score >= 70)`)
          } catch (error) {
            console.error('⚠️ Failed to fetch POIs along route:', error)
            structuredContext.poisAlongRoute = []
            structuredContext.worthwhilePOIs = []
          }
        }

        // Fetch POIs with hours cheaply per location (OpenTripMap/WikiVoyage-backed)
        const { fetchCompleteLocationData } = await import('../../../services/locationDataService')
        const poisByLocation: Record<string, Array<{ name: string; category?: string; latitude?: number; longitude?: number }>> = {}
        for (const loc of locationsData) {
          if (typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
            const data = await fetchCompleteLocationData(loc.name, loc.latitude, loc.longitude)
            const top = (data.attractions || []).slice(0, 12).map((a: any) => ({
              name: a.name || a.title || 'POI',
              category: (a.kinds || a.category || '').split(',')[0] || undefined,
              latitude: a.latitude,
              longitude: a.longitude
            }))
            poisByLocation[loc.name] = top
          }
        }
        structuredContext.poisByLocation = poisByLocation
      } catch (err) {
        console.warn('⚠️ Structured context pre-compute failed (non-fatal):', err)
      }

      // 6.5. Separate locations: COMPLETE (use DB) vs INCOMPLETE (need AI enrichment)
      const completeLocations = locationsData.filter(loc => loc.hasCompleteData)
      const incompleteLocations = locationsData.filter(loc => !loc.hasCompleteData)

      console.log('\n' + '═'.repeat(80))
      console.log('📊 DATABASE OPTIMIZATION REPORT')
      console.log('═'.repeat(80))
      console.log(`✅ ${completeLocations.length}/${locationsData.length} locations have COMPLETE data in database`)
      console.log(`   → Will use existing activities, restaurants, images, coordinates`)
      console.log(`   → NO external API calls needed for these locations`)
      console.log(`⚠️  ${incompleteLocations.length}/${locationsData.length} locations have LIMITED data`)
      console.log(`   → Will use available data + AI for enrichment`)

      if (completeLocations.length > 0) {
        console.log('\n📦 COMPLETE LOCATIONS (using database):')
        completeLocations.forEach(l => {
          console.log(`   • ${l.name}: ${l.activities.length} activities, ${l.restaurants.length} restaurants, ${l.featuredImage ? 'image ✓' : 'no image'}`)
        })
      }

      if (incompleteLocations.length > 0) {
        console.log('\n🔧 LIMITED LOCATIONS (need enrichment):')
        incompleteLocations.forEach(l => {
          console.log(`   • ${l.name}: ${l.activities.length} activities, ${l.restaurants.length} restaurants`)
        })
      }

      const estimatedApiSavings = completeLocations.length * 3 // 3 API calls per location (activities, restaurants, images)
      console.log(`\n💰 ESTIMATED API SAVINGS: ${estimatedApiSavings} external API calls avoided`)
      console.log('═'.repeat(80) + '\n')

      // 7. Generate plan using AI (Pro mode or standard)
      console.log(`🤖 Generating plan with AI${command.proMode ? ' (Pro Mode)' : ''}...`)

      let aiResult
      if (command.proMode) {
        // Use enhanced AI service with reasoning model
        const enhancedAI = new EnhancedGroqAIService()
        aiResult = await enhancedAI.generateWithProMode(
          {
            fromLocation: routeInfo.fromLocation,
            toLocation: routeInfo.toLocation,
            totalDays,
            routeDistance: routeInfo.distanceKm,
            routeDuration: routeInfo.estimatedDurationHours,
            stops: routeInfo.stops.map(s => s.name),
            interests: command.interests || [],
            budget: command.budget || 'moderate',
            maxTravelHoursPerDay: command.maxTravelHoursPerDay,
            transportMode: command.transportMode,
            locationsData,
            structuredContext
          },
          command.startDate
        )
      } else {
        // Use standard AI service
        aiResult = await this.aiService.generateplan(
          {
            fromLocation: routeInfo.fromLocation,
            toLocation: routeInfo.toLocation,
            totalDays,
            routeDistance: routeInfo.distanceKm,
            routeDuration: routeInfo.estimatedDurationHours,
            stops: routeInfo.stops.map(s => s.name),
            interests: command.interests || [],
            budget: command.budget || 'moderate',
            maxTravelHoursPerDay: command.maxTravelHoursPerDay,
            transportMode: command.transportMode, // ✅ ADDED: Pass transport mode to AI
            locationsData,
            structuredContext
          },
          command.startDate
        )
      }

      // 8. PROFESSIONAL INTEGRATION: Enrich locations with AI metadata
      console.log('🌍 Enriching locations with AI metadata...')
      await this.enrichLocationsWithAIMetadata(aiResult.days)

      // 9. Create domain entity
      const plan = Plan.create({
        title: aiResult.title,
        summary: aiResult.summary,
        days: aiResult.days,
        totalCostEstimate: aiResult.totalCostEstimate,
        tips: aiResult.tips,
        transportMode: command.transportMode // Include transport mode
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

      const cacheRepo = getCachedItineraryRepository()
      await cacheRepo.save(cacheParams, {
        title: aiResult.title,
        summary: aiResult.summary,
        days: aiResult.days,
        totalCostEstimate: aiResult.totalCostEstimate,
        tips: aiResult.tips,
        __context: structuredContext // Persist structured context inside plan_data for reuse
      }).catch(error => {
        // Don't fail the request if caching fails
        console.error('⚠️ Failed to cache plan:', error)
      })

      // 10. Fetch location images from database WITH GALLERY SUPPORT
      console.log('🖼️ Fetching location images with galleries...')
      const locationImages = await this.locationRepo.getLocationImagesWithGallery([
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
        locationImages,
        structuredContext
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
   * Fetch detailed data for all locations INCLUDING images and coordinates
   * This prevents redundant API calls by using existing database resources
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

    // Fetch featured images for all locations from database
    const locationImages = await this.fetchLocationImages(validResults.map(r => r.location.slug))

    return validResults.map(result => ({
      name: result.location.name,
      slug: result.location.slug,
      latitude: result.location.latitude,
      longitude: result.location.longitude,
      country: result.location.country,
      region: result.location.region,
      featuredImage: locationImages[result.location.slug] || null,
      activities: result.activities,
      restaurants: result.restaurants,
      hasCompleteData: result.activities.length >= 5 && result.restaurants.length >= 3
    }))
  }

  /**
   * Fetch featured images from database for locations
   * Returns map of slug -> image URL
   */
  private async fetchLocationImages(slugs: string[]): Promise<Record<string, string>> {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase
      .from('locations')
      .select('slug, featured_image, gallery_images')
      .in('slug', slugs)

    if (error) {
      console.error('❌ Error fetching location images:', error)
      return {}
    }

    const imageMap: Record<string, string> = {}
    data?.forEach((row: any) => {
      const url = row.featured_image || (Array.isArray(row.gallery_images) && row.gallery_images.length > 0 ? row.gallery_images[0] : null)
      if (url) {
        imageMap[row.slug] = url
      }
    })

    console.log(`🖼️ Found ${Object.keys(imageMap).length}/${slugs.length} featured images from locations table`)
    return imageMap
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

