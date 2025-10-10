import { notFound } from 'next/navigation'
import { getLocationBySlug, getLocationsByCountry, getAllLocationSlugs } from '@/lib/supabase/locations'
import { mapSupabaseLocationToFrontend, mapSupabaseLocationsToFrontend } from '@/lib/mappers/locationMapper'
import { LocationDetailTemplate } from '@/components/locations/LocationDetailTemplate'

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
  // Get location data by slug from Supabase
  const supabaseLocation = await getLocationBySlug(params.slug)

  if (!supabaseLocation) {
    notFound()
  }

  // Map Supabase data to frontend format
  const location = mapSupabaseLocationToFrontend(supabaseLocation)

  // Get related locations from the same country
  const supabaseRelatedLocations = await getLocationsByCountry(location.country, location.id)
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
