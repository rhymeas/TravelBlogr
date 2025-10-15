import { createServerSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { SmartImage as Image } from '@/components/ui/SmartImage'
import Link from 'next/link'
import { MapPin, Calendar, ArrowLeft, Star, CheckCircle2, Lightbulb, Copy, Eye } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ViewTrackingPixel } from '@/components/analytics/ViewTrackingPixel'
import { QuickBookingLinks } from '@/components/locations/QuickBookingLinks'

interface Trip {
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
  is_public_template: boolean
  status: string
  start_date: string | null
  end_date: string | null
  created_at: string
}

interface Post {
  id: string
  title: string
  content: string
  featured_image: string | null
  post_date: string
  order_index: number
  location: string | null
}

export default async function PublicTripPage({ params }: { params: { slug: string } }) {
  const supabase = await createServerSupabase()
  
  // Fetch trip (public template or published trip)
  const { data: trip } = await supabase
    .from('trips')
    .select(`
      *,
      posts (
        id,
        title,
        content,
        featured_image,
        post_date,
        order_index,
        location
      ),
      trip_stats (
        total_views,
        unique_views
      )
    `)
    .eq('slug', params.slug)
    .or('is_public_template.eq.true,status.eq.published')
    .single()

  if (!trip) {
    notFound()
  }

  const tripData = trip as Trip & { posts: Post[], trip_stats: any[] }
  const posts = (tripData.posts || []).sort((a, b) => a.order_index - b.order_index)
  const totalViews = tripData.trip_stats?.[0]?.total_views || 0

  const tripTypeColors: Record<string, string> = {
    family: 'bg-blue-100 text-blue-700',
    adventure: 'bg-green-100 text-green-700',
    beach: 'bg-orange-100 text-orange-700',
    cultural: 'bg-purple-100 text-purple-700',
    'road-trip': 'bg-red-100 text-red-700',
    solo: 'bg-indigo-100 text-indigo-700',
    romantic: 'bg-pink-100 text-pink-700',
  }

  return (
    <div className="min-h-screen bg-gray-50 text-[85%]">
      {/* View Tracking */}
      <ViewTrackingPixel tripId={tripData.id} />

      {/* Hero Section */}
      <div className="relative h-80 overflow-hidden">
        {tripData.cover_image ? (
          <Image
            src={tripData.cover_image}
            alt={tripData.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-4 pb-8 max-w-6xl">
            <Link
              href="/trips-library"
              className="inline-flex items-center gap-1.5 text-white mb-3 hover:text-rausch-200 transition-colors text-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Gallery
            </Link>

            <div className="flex items-center gap-2 mb-3">
              {tripData.trip_type && (
                <span className={`px-2.5 py-0.5 ${tripTypeColors[tripData.trip_type] || 'bg-gray-100 text-gray-700'} text-xs font-semibold rounded-full capitalize`}>
                  {tripData.trip_type.replace('-', ' ')}
                </span>
              )}
              {tripData.is_featured && (
                <span className="px-2.5 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-semibold rounded-full flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-900" />
                  Featured
                </span>
              )}
              {tripData.is_public_template && (
                <span className="px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  Template
                </span>
              )}
            </div>

            <h1 className="text-4xl font-bold text-white mb-3">
              {tripData.title}
            </h1>

            <div className="flex items-center gap-4 text-white/90 text-sm">
              {tripData.destination && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span>{tripData.destination}</span>
                </div>
              )}
              {tripData.duration_days && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{tripData.duration_days} days</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                <span>{totalViews.toLocaleString()} views</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {tripData.description && (
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">About This Trip</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {tripData.description}
                </p>
              </Card>
            )}

            {/* Itinerary */}
            {posts.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Day-by-Day Itinerary</h2>
                <div className="space-y-4">
                  {posts.map((post, index) => (
                    <div key={post.id} className="border-l-4 border-rausch-500 pl-4 py-2">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-rausch-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{post.title}</h3>
                          {post.location && (
                            <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                              <MapPin className="h-3 w-3" />
                              <span>{post.location}</span>
                            </div>
                          )}
                          <div className="text-sm text-gray-700 prose prose-sm max-w-none">
                            {post.content}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Copy Template CTA */}
            {tripData.is_public_template && (
              <Card className="p-6 bg-gradient-to-br from-rausch-50 to-kazan-50 border-rausch-200">
                <h3 className="font-bold text-gray-900 mb-2">Use This Template</h3>
                <p className="text-sm text-gray-700 mb-4">
                  Copy this trip to your account and customize it for your own adventure!
                </p>
                <Button className="w-full bg-rausch-500 hover:bg-rausch-600 text-white">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to My Trips
                </Button>
              </Card>
            )}

            {/* Highlights */}
            {tripData.highlights && tripData.highlights.length > 0 && (
              <Card className="p-6">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Highlights
                </h3>
                <ul className="space-y-2">
                  {tripData.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Trip Details */}
            <Card className="p-6">
              <h3 className="font-bold text-gray-900 mb-3">Trip Details</h3>
              <div className="space-y-3 text-sm">
                {tripData.start_date && (
                  <div>
                    <span className="text-gray-600">Start Date:</span>
                    <p className="font-medium text-gray-900">
                      {new Date(tripData.start_date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}
                {tripData.end_date && (
                  <div>
                    <span className="text-gray-600">End Date:</span>
                    <p className="font-medium text-gray-900">
                      {new Date(tripData.end_date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Total Days:</span>
                  <p className="font-medium text-gray-900">{posts.length || tripData.duration_days || 'N/A'}</p>
                </div>
              </div>
            </Card>

            {/* Booking Links - Affiliate Revenue */}
            {tripData.destination && (
              <Card className="p-6">
                <QuickBookingLinks
                  locationName={tripData.destination}
                  context="trip_page"
                />
              </Card>
            )}

            {/* Tips */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-blue-500" />
                Travel Tips
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Book accommodations in advance</li>
                <li>• Check visa requirements</li>
                <li>• Get travel insurance</li>
                <li>• Download offline maps</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

