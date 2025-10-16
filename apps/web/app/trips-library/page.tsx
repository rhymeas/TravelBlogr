import { createServerSupabase } from '@/lib/supabase-server'
import { Card } from '@/components/ui/Card'
import { GalleryView } from '@/components/gallery/GalleryView'
import { MapPin, Calendar, Star } from 'lucide-react'
import Link from 'next/link'
import { HorizontalBannerAd } from '@/components/ads/HorizontalBannerAd'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Travel Guide Gallery | TravelBlogr',
  description: 'Get inspired by our curated collection of family-friendly travel guides',
}

interface SampleGuide {
  id: string
  title: string
  slug: string
  description: string
  cover_image: string
  destination: string
  duration_days: number
  trip_type: string
  highlights: string[]
  is_featured: boolean
  view_count: number
}

export default async function GalleryPage() {
  const supabase = await createServerSupabase()
  
  // Fetch public trip templates from unified trips table
  const { data: guides } = await supabase
    .from('trips')
    .select(`
      *,
      trip_stats (
        total_views,
        unique_views
      ),
      posts (id)
    `)
    .eq('is_public_template', true)
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })

  // Transform trips to match SampleGuide interface
  const sampleGuides = (guides || []).map(guide => ({
    ...guide,
    view_count: guide.trip_stats?.[0]?.total_views || 0,
    post_count: guide.posts?.length || 0
  })) as SampleGuide[]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-[85%]">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-rausch-500 to-rausch-600 text-white py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-3">
              ✨ Travel Guide Gallery
            </h1>
            <p className="text-rausch-50 mb-6 max-w-2xl mx-auto">
              Get inspired by our curated collection of family-friendly travel guides.
              See what your perfect trip could look like!
            </p>
            <div className="flex items-center justify-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                <span>Handpicked destinations</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span>Family-tested itineraries</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>Day-by-day plans</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Ad - Top Banner */}
      <HorizontalBannerAd
        slot="trips_library_top"
        page="trips-library"
        size="standard"
      />

      {/* Gallery Grid */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {sampleGuides.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600 text-sm">
              Sample guides coming soon! Check back later for inspiration.
            </p>
          </Card>
        ) : (
          <GalleryView guides={sampleGuides} />
        )}

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="p-12 bg-gradient-to-r from-rausch-50 to-babu-50 border-2 border-rausch-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Create Your Own?
            </h2>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
              Start planning your dream family vacation with our easy-to-use trip planner.
              Add notes, save locations, and create memories that last a lifetime.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/signup"
                className="px-8 py-3 bg-rausch-500 text-white rounded-lg hover:bg-rausch-600 transition-colors font-semibold"
              >
                Start Planning Free
              </Link>
              <Link
                href="/locations"
                className="px-8 py-3 bg-white text-rausch-500 border-2 border-rausch-500 rounded-lg hover:bg-rausch-50 transition-colors font-semibold"
              >
                Explore Destinations
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

