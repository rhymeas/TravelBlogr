import { notFound } from 'next/navigation'
import { getLocationBySlug } from '@/lib/supabase/locations'
import { mapSupabaseLocationToFrontend } from '@/lib/mappers/locationMapper'
import { PhotoGalleryView } from '@/components/locations/PhotoGalleryView'
import Link from 'next/link'
import { ChevronLeft, Share2, Heart, X } from 'lucide-react'

interface PhotosPageProps {
  params: {
    slug: string
  }
}

export default async function PhotosPage({ params }: PhotosPageProps) {
  const supabaseLocation = await getLocationBySlug(params.slug)

  if (!supabaseLocation) {
    notFound()
  }

  // Map Supabase data to frontend format
  const location = mapSupabaseLocationToFrontend(supabaseLocation)

  return (
    <>
      {/* Sticky Header with Breadcrumb */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back button and breadcrumb */}
            <div className="flex items-center gap-4">
              <Link
                href={`/locations/${location.slug}`}
                className="flex items-center gap-2 text-airbnb-black hover:bg-gray-100 rounded-full p-2 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>

              <nav className="hidden sm:flex items-center gap-2 text-body-small">
                <Link href="/locations" className="text-airbnb-gray hover:text-airbnb-black transition-colors">
                  Locations
                </Link>
                <span className="text-airbnb-gray">›</span>
                <Link href={`/locations?country=${location.country}`} className="text-airbnb-gray hover:text-airbnb-black transition-colors">
                  {location.country}
                </Link>
                <span className="text-airbnb-gray">›</span>
                <Link href={`/locations/${location.slug}`} className="text-airbnb-gray hover:text-airbnb-black transition-colors">
                  {location.name}
                </Link>
                <span className="text-airbnb-gray">›</span>
                <span className="text-airbnb-black font-semibold">Photos</span>
              </nav>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-body-small font-semibold">
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-body-small font-semibold">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Save</span>
              </button>
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
      <PhotoGalleryView location={location} />
    </>
  )
}

