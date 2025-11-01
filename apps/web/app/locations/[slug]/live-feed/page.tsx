import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, X } from 'lucide-react'

import { getLocationBySlug } from '@/lib/supabase/locations'
import { mapSupabaseLocationToFrontend } from '@/lib/mappers/locationMapper'
import { LocationShareActions } from '@/components/locations/LocationShareActions'
import { CommunityContributorBadge } from '@/components/locations/CommunityContributorBadge'
import { LocationFeedGrid } from '@/components/feed/LocationFeedGrid'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

interface LiveFeedPageProps {
  params: { slug: string }
}

export default async function LiveFeedPage({ params }: LiveFeedPageProps) {
  const supabaseLocation = await getLocationBySlug(params.slug)
  if (!supabaseLocation) {
    notFound()
  }

  const location = mapSupabaseLocationToFrontend(supabaseLocation)

  return (
    <div className="bg-white min-h-screen">
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
                <span className="text-sleek-black font-semibold">Live Feed</span>
              </nav>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <CommunityContributorBadge
                locationId={location.id}
                locationName={location.name}
              />

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

      {/* Live Feed Content */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-title-medium font-semibold text-sleek-black">Live Feed near {location.name}</h1>
          <span className="text-body-small text-sleek-gray">Within 100km</span>
        </div>
        <LocationFeedGrid slug={location.slug} radiusKm={100} />
      </div>
    </div>
  )
}

