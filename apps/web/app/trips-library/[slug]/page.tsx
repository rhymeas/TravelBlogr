import { createServerSupabase } from '@/lib/supabase-server'
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
  const supabase = await createServerSupabase()
  
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
            <Link
              href="/trips-library"
              className="inline-flex items-center gap-1.5 text-white mb-3 hover:text-rausch-200 transition-colors text-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Gallery
            </Link>

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card className="p-5">
              <h2 className="text-xl font-bold text-gray-900 mb-3">About This Trip</h2>
              <p className="text-gray-700 leading-relaxed">
                {sampleGuide.description}
              </p>
            </Card>

            {/* At a Glance - Traditional Travel Guide Element */}
            <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-blue-600" />
                At a Glance
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-semibold text-gray-700">Duration</p>
                  <p className="text-gray-600">{sampleGuide.duration_days} days</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Best For</p>
                  <p className="text-gray-600 capitalize">{sampleGuide.trip_type} travel</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Budget</p>
                  <p className="text-gray-600">$$$ Moderate</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Difficulty</p>
                  <p className="text-gray-600">Easy to Moderate</p>
                </div>
              </div>
            </Card>

            {/* Day-by-Day Itinerary */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                📅 Day-by-Day Itinerary
              </h2>
              <div className="space-y-4">
                {guideDays.map((day) => {
                  // Emotional images for each day (using Unsplash)
                  const dayImages: Record<number, string> = {
                    1: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&h=400&fit=crop', // Shibuya crossing
                    2: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800&h=400&fit=crop', // TeamLab
                    3: 'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=800&h=400&fit=crop', // Harajuku
                    4: 'https://images.unsplash.com/photo-1624923686627-514dd5e57bae?w=800&h=400&fit=crop', // Disney
                    5: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&h=400&fit=crop', // Temple
                    6: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=400&fit=crop', // Food
                    7: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800&h=400&fit=crop', // Tokyo station
                  }

                  return (
                    <Card key={day.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      {/* Day Image */}
                      {dayImages[day.day_number] && (
                        <div className="relative h-48 overflow-hidden">
                          <Image
                            src={dayImages[day.day_number]}
                            alt={day.title}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute top-3 left-3">
                            <div className="w-10 h-10 bg-rausch-500 text-white rounded-full flex items-center justify-center font-bold shadow-lg">
                              {day.day_number}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="p-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {day.title}
                        </h3>
                        <p className="text-gray-700 mb-3 text-sm">
                          {day.description}
                        </p>

                        {/* Activities */}
                        {day.activities && day.activities.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-gray-600 mb-1.5">Activities:</p>
                            <ul className="space-y-1.5">
                              {day.activities.map((activity, index) => (
                                <li key={index} className="flex items-start gap-1.5 text-gray-700 text-sm">
                                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                                  <span>{activity}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Tips */}
                        {day.tips && (
                          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                            <div className="flex items-start gap-1.5">
                              <Lightbulb className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-semibold text-yellow-900 mb-0.5">Pro Tip</p>
                                <p className="text-xs text-yellow-800">{day.tips}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Highlights */}
            <Card className="p-4 sticky top-4">
              <h3 className="text-lg font-bold text-gray-900 mb-3">✨ Highlights</h3>
              <ul className="space-y-2">
                {sampleGuide.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-1.5 text-gray-700 text-sm">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0 mt-0.5" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>

              {/* Essential Info - Traditional Travel Guide */}
              <div className="mt-5 pt-5 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">📋 Essential Info</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Best Time:</span>
                    <span className="font-medium">Mar-May, Sep-Nov</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Language:</span>
                    <span className="font-medium">Japanese</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Currency:</span>
                    <span className="font-medium">JPY (¥)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time Zone:</span>
                    <span className="font-medium">JST (UTC+9)</span>
                  </div>
                </div>
              </div>

              {/* Packing List - Traditional Element */}
              <div className="mt-5 pt-5 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">🎒 Don't Forget</h4>
                <ul className="space-y-1.5 text-xs text-gray-700">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    Comfortable walking shoes
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    Portable WiFi or SIM card
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    IC card (Suica/Pasmo)
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    Umbrella (any season)
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    Cash (many places cash-only)
                  </li>
                </ul>
              </div>

              {/* Budget Estimate - Traditional Element */}
              <div className="mt-5 pt-5 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">💰 Budget Estimate</h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-700">
                    <span>Accommodation:</span>
                    <span className="font-medium">$800-1200</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Food & Drinks:</span>
                    <span className="font-medium">$400-600</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Activities:</span>
                    <span className="font-medium">$300-500</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Transport:</span>
                    <span className="font-medium">$100-200</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 pt-2 border-t">
                    <span>Total (per person):</span>
                    <span>$1,600-2,500</span>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-5 pt-5 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm">Love this itinerary?</h4>
                <p className="text-xs text-gray-600 mb-3">
                  Create your own personalized travel guide!
                </p>
                <Link
                  href="/signup"
                  className="block w-full px-4 py-2.5 bg-rausch-500 text-white text-center rounded-lg hover:bg-rausch-600 transition-colors font-semibold text-sm"
                >
                  Start Planning Free
                </Link>
                <Link
                  href="/locations"
                  className="block w-full mt-2 px-4 py-2.5 bg-white text-rausch-500 border-2 border-rausch-500 text-center rounded-lg hover:bg-rausch-50 transition-colors font-semibold text-sm"
                >
                  Explore Destinations
                </Link>
              </div>
            </Card>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-10">
          <Card className="p-8 bg-gradient-to-r from-rausch-500 to-rausch-600 text-white text-center">
            <h2 className="text-3xl font-bold mb-3">
              Ready to Create Your Own Adventure?
            </h2>
            <p className="text-rausch-50 mb-6 max-w-2xl mx-auto">
              Join thousands of families planning unforgettable trips with TravelBlogr.
              It's free to start!
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/signup"
                className="px-6 py-3 bg-white text-rausch-500 rounded-lg hover:bg-gray-100 transition-colors font-bold"
              >
                Sign Up Free
              </Link>
              <Link
                href="/trips-library"
                className="px-6 py-3 bg-rausch-700 text-white rounded-lg hover:bg-rausch-800 transition-colors font-bold"
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

