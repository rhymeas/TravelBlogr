import { createServerSupabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { SmartImage as Image } from '@/components/ui/SmartImage'
import Link from 'next/link'
import { MapPin, Calendar, Star, Eye, ArrowRight } from 'lucide-react'

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
  const supabase = createServerSupabase()
  
  const { data: guides } = await supabase
    .from('sample_travel_guides')
    .select('*')
    .order('is_featured', { ascending: false })
    .order('view_count', { ascending: false })

  const sampleGuides = (guides || []) as SampleGuide[]

  const tripTypeColors: Record<string, string> = {
    family: 'bg-blue-100 text-blue-700',
    adventure: 'bg-green-100 text-green-700',
    beach: 'bg-orange-100 text-orange-700',
    cultural: 'bg-purple-100 text-purple-700',
    'road-trip': 'bg-red-100 text-red-700',
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-rausch-500 to-rausch-600 text-white py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4">
              ✨ Travel Guide Gallery
            </h1>
            <p className="text-xl text-rausch-50 mb-8 max-w-2xl mx-auto">
              Get inspired by our curated collection of family-friendly travel guides.
              See what your perfect trip could look like!
            </p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-yellow-300 text-yellow-300" />
                <span>Handpicked destinations</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>Family-tested itineraries</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>Day-by-day plans</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {sampleGuides.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-600">
              Sample guides coming soon! Check back later for inspiration.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {sampleGuides.map((guide) => (
              <Link key={guide.id} href={`/gallery/${guide.slug}`}>
                <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group">
                  {/* Cover Image */}
                  <div className="relative h-64 overflow-hidden">
                    <Image
                      src={guide.cover_image}
                      alt={guide.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    
                    {/* Featured Badge */}
                    {guide.is_featured && (
                      <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-semibold rounded-full flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-900" />
                          Featured
                        </span>
                      </div>
                    )}

                    {/* Trip Type Badge */}
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 ${tripTypeColors[guide.trip_type] || 'bg-gray-100 text-gray-700'} text-xs font-semibold rounded-full capitalize`}>
                        {guide.trip_type.replace('-', ' ')}
                      </span>
                    </div>

                    {/* Duration */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm font-medium">{guide.duration_days} days</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-2xl font-bold text-gray-900 group-hover:text-rausch-500 transition-colors">
                        {guide.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600 mb-3">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{guide.destination}</span>
                    </div>

                    <p className="text-gray-700 mb-4 line-clamp-2">
                      {guide.description}
                    </p>

                    {/* Highlights */}
                    {guide.highlights && guide.highlights.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-500 mb-2">HIGHLIGHTS</p>
                        <div className="flex flex-wrap gap-2">
                          {guide.highlights.slice(0, 3).map((highlight, index) => (
                            <span
                              key={index}
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                            >
                              {highlight}
                            </span>
                          ))}
                          {guide.highlights.length > 3 && (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                              +{guide.highlights.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-1 text-gray-500 text-sm">
                        <Eye className="h-4 w-4" />
                        <span>{guide.view_count.toLocaleString()} views</span>
                      </div>
                      <div className="flex items-center gap-2 text-rausch-500 font-semibold group-hover:gap-3 transition-all">
                        <span>View Guide</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
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

