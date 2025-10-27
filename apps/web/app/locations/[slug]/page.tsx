import { notFound } from 'next/navigation'
import { getLocationBySlug, getLocationsByCountry, getAllLocationSlugs } from '@/lib/supabase/locations'
import { mapSupabaseLocationToFrontend, mapSupabaseLocationsToFrontend } from '@/lib/mappers/locationMapper'
import { LocationDetailTemplate } from '@/components/locations/LocationDetailTemplate'
import { getOrSet, CacheKeys, CacheTTL } from '@/lib/upstash'

// Allow dynamic params for newly created locations (not in generateStaticParams)
export const dynamicParams = true
// Force dynamic rendering to prevent SSR issues with client components
export const dynamic = 'force-dynamic'

interface LocationPageProps {
  params: {
    slug: string
  }
}

export default async function LocationPage({ params }: LocationPageProps) {
  // Use Upstash cache for fast loading (our speed backbone!)
  const supabaseLocation = await getOrSet(
    CacheKeys.location(params.slug),
    async () => {
      console.log(`🔍 Fetching location from database: ${params.slug}`)
      return await getLocationBySlug(params.slug)
    },
    CacheTTL.LONG // 24 hours
  )

  if (!supabaseLocation) {
    notFound()
  }

  console.log(`✅ Location loaded for ${params.slug}`)

  // Map Supabase data to frontend format
  const location = mapSupabaseLocationToFrontend(supabaseLocation)

  // Get related locations from the same country (also cached)
  const supabaseRelatedLocations = await getOrSet(
    `${CacheKeys.location(params.slug)}:related`,
    async () => {
      console.log(`🔍 Fetching related locations for: ${location.country}`)
      return await getLocationsByCountry(location.country, location.id)
    },
    CacheTTL.LONG // 24 hours
  )

  const relatedLocations = mapSupabaseLocationsToFrontend(supabaseRelatedLocations)

  return (
    <LocationDetailTemplate
      location={location}
      relatedLocations={relatedLocations}
    />
  )
}

// Generate static params for all published locations
// Disabled: Returns empty array to prevent build-time database access
// Pages will be generated on-demand at runtime instead
export async function generateStaticParams() {
  // Don't pre-generate any pages at build time
  // This prevents build-time dependency on database/environment variables
  return []
}
