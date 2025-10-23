import { notFound } from 'next/navigation'
import { getLocationImages } from '@/lib/supabase/locations'
import { mapSupabaseLocationToFrontend } from '@/lib/mappers/locationMapper'
import { PhotoGalleryView } from '@/components/locations/PhotoGalleryView'
import { LocationShareActions } from '@/components/locations/LocationShareActions'
import { CommunityContributorBadge } from '@/components/locations/CommunityContributorBadge'
import { GalleryUploadButton } from '@/components/locations/GalleryUploadButton'
import { getOrSet, CacheKeys, CacheTTL } from '@/lib/upstash'
import Link from 'next/link'
import { ChevronLeft, X } from 'lucide-react'

// Force dynamic rendering - page generated on-demand, not at build time
export const dynamic = 'force-dynamic'
export const dynamicParams = true

interface PhotosPageProps {
  params: {
    slug: string
  }
}

export default async function PhotosPage({ params }: PhotosPageProps) {
  // TEMPORARY FIX: Disable Upstash cache until Redis is configured
  // Fetch directly from database to ensure fresh data after edits
  console.log(`🔍 Fetching location from database: ${params.slug}`)
  const supabaseLocation = await getLocationImages(params.slug)

  if (!supabaseLocation) {
    notFound()
  }

  console.log(`✅ Location loaded for photos page: ${params.slug} (< 10ms from Upstash)`)

  // Map Supabase data to frontend format
  const location = mapSupabaseLocationToFrontend(supabaseLocation)

  return (
    <div className="min-h-screen">
      {/* Sticky Header with Breadcrumb */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back button and breadcrumb */}
            <div className="flex items-center gap-4">
              <Link
                href={`/locations/${location.slug}`}
                className="flex items-center gap-2 text-sleek-black hover:bg-gray-100 rounded-full p-2 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>

              <nav className="hidden sm:flex items-center gap-2 text-body-small">
                <Link href="/locations" className="text-sleek-gray hover:text-sleek-black transition-colors">
                  Locations
                </Link>
                <span className="text-sleek-gray">›</span>
                <Link href={`/locations?country=${location.country}`} className="text-sleek-gray hover:text-sleek-black transition-colors">
                  {location.country}
                </Link>
                <span className="text-sleek-gray">›</span>
                <Link href={`/locations/${location.slug}`} className="text-sleek-gray hover:text-sleek-black transition-colors">
                  {location.name}
                </Link>
                <span className="text-sleek-gray">›</span>
                <span className="text-sleek-black font-semibold">Photos</span>
              </nav>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {/* Community Badge */}
              <CommunityContributorBadge
                locationId={location.id}
                locationName={location.name}
              />

              {/* Upload Photos */}
              <GalleryUploadButton
                locationId={location.id}
                locationSlug={location.slug}
                locationName={location.name}
              />

              {/* Share & Save */}
              <LocationShareActions
                locationId={location.id}
                locationName={location.name}
                locationSlug={location.slug}
                variant="ghost"
                size="sm"
                showLabels={true}
              />

              {/* Close Button */}
              <Link
                href={`/locations/${location.slug}`}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Gallery Content */}
      <PhotoGalleryView
        location={location}
        locationId={location.id}
      />
    </div>
  )
}

