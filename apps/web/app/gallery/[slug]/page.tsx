import { createServerSupabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { SmartImage as Image } from '@/components/ui/SmartImage'
import Link from 'next/link'
import { MapPin, Calendar, ArrowLeft, Star, CheckCircle2, Lightbulb } from 'lucide-react'

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
  const supabase = createServerSupabase()
  
  // Fetch guide
  const { data: guide } = await supabase
    .from('sample_travel_guides')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!guide) {
    notFound()
  }

  // Fetch itinerary days
  const { data: days } = await supabase
    .from('sample_guide_days')
    .select('*')
    .eq('guide_id', guide.id)
    .order('day_number', { ascending: true })

  const sampleGuide = guide as SampleGuide
  const guideDays = (days || []) as GuideDay[]

  const tripTypeColors: Record<string, string> = {
    family: 'bg-blue-100 text-blue-700',
    adventure: 'bg-green-100 text-green-700',
    beach: 'bg-orange-100 text-orange-700',
    cultural: 'bg-purple-100 text-purple-700',
    'road-trip': 'bg-red-100 text-red-700',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
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
          <div className="container mx-auto px-4 pb-12 max-w-6xl">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 text-white mb-4 hover:text-rausch-200 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Gallery
            </Link>
            
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 ${tripTypeColors[sampleGuide.trip_type] || 'bg-gray-100 text-gray-700'} text-sm font-semibold rounded-full capitalize`}>
                {sampleGuide.trip_type.replace('-', ' ')}
              </span>
              {sampleGuide.is_featured && (
                <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-sm font-semibold rounded-full flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-900" />
                  Featured
                </span>
              )}
            </div>

            <h1 className="text-5xl font-bold text-white mb-4">
              {sampleGuide.title}
            </h1>
            
            <div className="flex items-center gap-6 text-white text-lg">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>{sampleGuide.destination}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>{sampleGuide.duration_days} days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Trip</h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                {sampleGuide.description}
              </p>
            </Card>

            {/* Day-by-Day Itinerary */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                📅 Day-by-Day Itinerary
              </h2>
              <div className="space-y-6">
                {guideDays.map((day) => (
                  <Card key={day.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-rausch-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                          {day.day_number}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {day.title}
                        </h3>
                        <p className="text-gray-700 mb-4">
                          {day.description}
                        </p>

                        {/* Activities */}
                        {day.activities && day.activities.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-600 mb-2">Activities:</p>
                            <ul className="space-y-2">
                              {day.activities.map((activity, index) => (
                                <li key={index} className="flex items-start gap-2 text-gray-700">
                                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                  <span>{activity}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Tips */}
                        {day.tips && (
                          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                            <div className="flex items-start gap-2">
                              <Lightbulb className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-semibold text-yellow-900 mb-1">Pro Tip</p>
                                <p className="text-sm text-yellow-800">{day.tips}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Highlights */}
            <Card className="p-6 sticky top-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">✨ Highlights</h3>
              <ul className="space-y-3">
                {sampleGuide.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 flex-shrink-0 mt-0.5" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Love this itinerary?</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Create your own personalized travel guide with our easy-to-use planner!
                </p>
                <Link
                  href="/signup"
                  className="block w-full px-6 py-3 bg-rausch-500 text-white text-center rounded-lg hover:bg-rausch-600 transition-colors font-semibold"
                >
                  Start Planning Free
                </Link>
                <Link
                  href="/locations"
                  className="block w-full mt-3 px-6 py-3 bg-white text-rausch-500 border-2 border-rausch-500 text-center rounded-lg hover:bg-rausch-50 transition-colors font-semibold"
                >
                  Explore Destinations
                </Link>
              </div>
            </Card>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16">
          <Card className="p-12 bg-gradient-to-r from-rausch-500 to-rausch-600 text-white text-center">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Create Your Own Adventure?
            </h2>
            <p className="text-xl text-rausch-50 mb-8 max-w-2xl mx-auto">
              Join thousands of families planning unforgettable trips with TravelBlogr.
              It's free to start!
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/signup"
                className="px-8 py-4 bg-white text-rausch-500 rounded-lg hover:bg-gray-100 transition-colors font-bold text-lg"
              >
                Sign Up Free
              </Link>
              <Link
                href="/gallery"
                className="px-8 py-4 bg-rausch-700 text-white rounded-lg hover:bg-rausch-800 transition-colors font-bold text-lg"
              >
                View More Examples
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

