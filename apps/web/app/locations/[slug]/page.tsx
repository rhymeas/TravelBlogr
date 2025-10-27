import { notFound } from 'next/navigation'
import { getLocationBySlug, getLocationsByCountry, getAllLocationSlugs } from '@/lib/supabase/locations'
import { mapSupabaseLocationToFrontend, mapSupabaseLocationsToFrontend } from '@/lib/mappers/locationMapper'
import { LocationDetailTemplate } from '@/components/locations/LocationDetailTemplate'
import { getOrSet, CacheKeys, CacheTTL } from '@/lib/upstash'
import { performanceTracker } from '@/lib/analytics/performanceTracker'

// Allow dynamic params for newly created locations (not in generateStaticParams)
export const dynamicParams = true

// Force dynamic rendering - REQUIRED because:
// 1. Root layout uses React Context (AuthProvider, AuthModalProvider)
// 2. Context cannot be statically generated at build time
// 3. ISR would fail during static generation phase
// 4. We use Upstash Redis for caching instead (< 10ms cache hits)
export const dynamic = 'force-dynamic'

interface LocationPageProps {
  params: {
    slug: string
  }
}

export default async function LocationPage({ params }: LocationPageProps) {
  const pageStartTime = Date.now()
  const pagePath = `/locations/${params.slug}`

  try {
    // Use Upstash cache for fast loading (our speed backbone!)
    const supabaseLocation = await getOrSet(
      CacheKeys.location(params.slug),
      async () => {
        const dbStartTime = Date.now()
        console.log(`🔍 Fetching location from database: ${params.slug}`)
        const result = await getLocationBySlug(params.slug)
        const dbDuration = Date.now() - dbStartTime

        // Track database query performance
        performanceTracker.trackDbQuery('getLocationBySlug', dbDuration, {
          slug: params.slug,
          found: !!result
        })

        return result
      },
      CacheTTL.LONG // 24 hours
    )

    if (!supabaseLocation) {
      // Track 404 as error
      performanceTracker.trackError(
        new Error(`Location not found: ${params.slug}`),
        pagePath,
        { slug: params.slug, statusCode: 404 }
      )
      notFound()
    }

    console.log(`✅ Location loaded for ${params.slug}`)

    // Map Supabase data to frontend format
    const location = mapSupabaseLocationToFrontend(supabaseLocation)

    // Get related locations from the same country (also cached)
    const supabaseRelatedLocations = await getOrSet(
      `${CacheKeys.location(params.slug)}:related`,
      async () => {
        const dbStartTime = Date.now()
        console.log(`🔍 Fetching related locations for: ${location.country}`)
        const result = await getLocationsByCountry(location.country, location.id)
        const dbDuration = Date.now() - dbStartTime

        // Track database query performance
        performanceTracker.trackDbQuery('getLocationsByCountry', dbDuration, {
          country: location.country,
          count: result.length
        })

        return result
      },
      CacheTTL.LONG // 24 hours
    )

    const relatedLocations = mapSupabaseLocationsToFrontend(supabaseRelatedLocations)

    // Track successful page render
    const pageDuration = Date.now() - pageStartTime
    performanceTracker.trackPageRender(pagePath, pageDuration, {
      success: true,
      slug: params.slug,
      relatedCount: relatedLocations.length
    })

    return (
      <LocationDetailTemplate
        location={location}
        relatedLocations={relatedLocations}
      />
    )
  } catch (error) {
    // Track error
    const pageDuration = Date.now() - pageStartTime
    performanceTracker.trackPageRender(pagePath, pageDuration, {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    performanceTracker.trackError(
      error instanceof Error ? error : new Error(String(error)),
      pagePath,
      { slug: params.slug }
    )
    throw error
  }
}

// Generate static params for all published locations
// Disabled: Returns empty array to prevent build-time database access
// Pages will be generated on-demand at runtime instead
export async function generateStaticParams() {
  // Don't pre-generate any pages at build time
  // This prevents build-time dependency on database/environment variables
  return []
}
