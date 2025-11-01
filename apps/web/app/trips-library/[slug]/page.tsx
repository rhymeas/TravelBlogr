import { createServerSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { SmartImage as Image } from '@/components/ui/SmartImage'
import Link from 'next/link'
import { MapPin, Calendar, ArrowLeft, Star } from 'lucide-react'
import { TripTemplateActions } from '@/components/trips-library/TripTemplateActions'
import { HeaderCopyButton } from '@/components/trips-library/HeaderCopyButton'
import { HorizontalBannerAd } from '@/components/ads/HorizontalBannerAd'
import { TripPageClient } from '@/components/trips-library/TripPageClient'

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

interface GuideDay {
  id: string
  day_number: number
  title: string
  description: string
  activities: string[]
  tips: string | null
}

export default async function GalleryDetailPage({ params }: { params: { slug: string } }) {
  const supabase = await createServerSupabase()

  // Fetch trip template from unified trips table
  const { data: trip } = await supabase
    .from('trips')
    .select(`
      *,
      posts (
        id,
        title,
        content,
        post_date,
        order_index,
        location,
        tips
      )
    `)
    .eq('slug', params.slug)
    .eq('is_public_template', true)
    .eq('status', 'published')
    .single()

  if (!trip) {
    notFound()
  }

  // Transform trip to match SampleGuide interface
  const sampleGuide: SampleGuide = {
    id: trip.id,
    title: trip.title,
    slug: trip.slug,
    description: trip.description || '',
    cover_image: trip.cover_image || '',
    destination: trip.destination || '',
    duration_days: trip.duration_days || 0,
    trip_type: trip.trip_type || 'family',
    highlights: trip.highlights || [],
    is_featured: trip.is_featured || false,
    view_count: 0
  }

  // Transform posts to guideDays format
  const guideDays: GuideDay[] = (trip.posts || [])
    .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
    .map((post: any, index: number) => ({
      id: post.id,
      day_number: index + 1,
      title: post.title,
      description: post.content || '',
      activities: [], // Can be extracted from content if needed
      tips: post.tips || null
    }))

  const tripTypeColors: Record<string, string> = {
    family: 'bg-blue-100 text-blue-700',
    adventure: 'bg-green-100 text-green-700',
    beach: 'bg-orange-100 text-orange-700',
    cultural: 'bg-purple-100 text-purple-700',
    'road-trip': 'bg-red-100 text-red-700',
  }

  return (
    <div className="min-h-screen bg-gray-50 text-[85%]">
      {/* Hero Section - Reduced height */}
      <div className="relative h-80 overflow-hidden">
        <Image
          src={sampleGuide.cover_image}
          alt={sampleGuide.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-4 pb-8 max-w-6xl">
            <div className="flex items-center justify-between mb-3">
              <Link
                href="/trips-library"
                className="inline-flex items-center gap-1.5 text-white hover:text-rausch-200 transition-colors text-sm"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Gallery
              </Link>

              {/* Copy to My Trips Button - Only for authenticated users */}
              <HeaderCopyButton
                guideId={sampleGuide.id}
                guideTitle={sampleGuide.title}
              />
            </div>

            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2.5 py-0.5 ${tripTypeColors[sampleGuide.trip_type] || 'bg-gray-100 text-gray-700'} text-xs font-semibold rounded-full capitalize`}>
                {sampleGuide.trip_type.replace('-', ' ')}
              </span>
              {sampleGuide.is_featured && (
                <span className="px-2.5 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-semibold rounded-full flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-900" />
                  Featured
                </span>
              )}
            </div>

            <h1 className="text-4xl font-bold text-white mb-3">
              {sampleGuide.title}
            </h1>

            <div className="flex items-center gap-5 text-white">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span>{sampleGuide.destination}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{sampleGuide.duration_days} days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Trip Content with Tabs and Timeline */}
        <TripPageClient
          guideDays={guideDays}
          guideTitle={sampleGuide.title}
          guideId={sampleGuide.id}
          destination={sampleGuide.destination}
          tripType={sampleGuide.trip_type}
          durationDays={sampleGuide.duration_days}
          highlights={sampleGuide.highlights}
          description={sampleGuide.description}
        />

        {/* Google Ad - Horizontal Banner (Mid-Content) */}
        <div className="mt-10">
          <HorizontalBannerAd
            slot="trip_template_mid_content"
            page="trip-template-detail"
            size="standard"
          />
        </div>

        {/* Auth-Aware Bottom CTA */}
        <div className="mt-10">
          <TripTemplateActions
            guideId={sampleGuide.id}
            guideTitle={sampleGuide.title}
          />
        </div>

        {/* Google Ad - Horizontal Banner (Bottom) */}
        <div className="mt-10">
          <HorizontalBannerAd
            slot="trip_template_bottom"
            page="trip-template-detail"
            size="large"
          />
        </div>
      </div>
    </div>
  )
}

