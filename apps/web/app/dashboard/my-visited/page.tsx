import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Check, MapPin, Calendar, TrendingUp, Sparkles, Compass, Star, Globe } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Image from 'next/image'
import { OverlayAction } from '@/components/wishlist/OverlayAction'

export const metadata = {
  title: 'My Visited Places | TravelBlogr',
  description: 'Track all the amazing places you\'ve visited'
}

interface VisitedLocation {
  id: string
  location_id: string
  visit_date: string | null
  created_at: string
  updated_at: string
  locations: {
    id: string
    name: string
    slug: string
    country: string
    region: string
    description: string
    featured_image: string | null
    rating: number | null
  }
}

export default async function MyVisitedPage() {
  const supabase = await createServerSupabase()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/signin?redirect=/dashboard/my-visited')
  }

  // Fetch visited locations
  const { data: visitedData, error } = await supabase
    .from('user_locations')
    .select(`
      id,
      location_id,
      visit_date,
      created_at,
      updated_at,
      locations (
        id,
        name,
        slug,
        country,
        region,
        description,
        featured_image,
        rating
      )
    `)
    .eq('user_id', user.id)
    .eq('is_visited', true)
    .order('visit_date', { ascending: false, nullsFirst: false })

  const visited = (visitedData || []) as unknown as VisitedLocation[]

  // Calculate stats
  const countries = new Set(visited.map(v => v.locations.country))
  const thisYear = visited.filter(v => {
    if (!v.visit_date) return false
    const date = new Date(v.visit_date)
    return date.getFullYear() === new Date().getFullYear()
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-green-100 rounded-lg">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">My Visited Places</h1>
            <p className="text-gray-600">
              Track your travel journey and celebrate your adventures
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Visited</p>
              <p className="text-2xl font-bold text-gray-900">{visited.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Globe className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Countries</p>
              <p className="text-2xl font-bold text-gray-900">{countries.size}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">This Year</p>
              <p className="text-2xl font-bold text-gray-900">{thisYear.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {visited.length > 0
                  ? (visited.reduce((sum, v) => sum + (v.locations.rating || 0), 0) / visited.length).toFixed(1)
                  : '0.0'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Motivational Banner */}
      {visited.length > 0 && visited.length < 5 && (
        <Card className="p-4 mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-l-green-500">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                🌍 Your Travel Journey Has Begun!
              </h3>
              <p className="text-sm text-gray-700">
                You've visited {visited.length} {visited.length === 1 ? 'place' : 'places'}. Keep exploring and marking your adventures!
              </p>
            </div>
          </div>
        </Card>
      )}

      {visited.length >= 10 && (
        <Card className="p-4 mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-l-purple-500">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                🎉 Amazing! You're a World Traveler!
              </h3>
              <p className="text-sm text-gray-700">
                {visited.length} places visited across {countries.size} {countries.size === 1 ? 'country' : 'countries'}! Your travel map is growing beautifully!
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Visited Grid */}
      {visited.length === 0 ? (
        <Card className="p-12 text-center bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Start Tracking Your Travels! ✈️
          </h3>
          <p className="text-gray-700 mb-2 max-w-md mx-auto">
            Mark locations as visited to build your personal travel map and track your adventures.
          </p>
          <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
            💡 <strong>Pro tip:</strong> Click "Mark as Visited" on any location page to add it to your travel history!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/locations"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <MapPin className="h-5 w-5" />
              Explore Locations
            </Link>
            <Link
              href="/trips-library"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-green-600 border-2 border-green-600 rounded-lg hover:bg-green-50 transition-colors font-medium"
            >
              <Compass className="h-5 w-5" />
              Browse Trips
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {visited.map((item) => (
            <Link key={item.id} href={`/locations/${item.locations.slug}`}>
              <Card className="overflow-hidden hover:shadow-xl transition-all hover:scale-[1.02] group">
                {/* Image */}
                <div className="relative h-32 overflow-hidden bg-gray-200">
                  {item.locations.featured_image ? (
                    <Image
                      src={item.locations.featured_image}
                      alt={item.locations.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                      <MapPin className="h-12 w-12 text-green-400" />
                    </div>
                  )}
                  <OverlayAction slug={item.locations.slug} variant="visited" />
                </div>

                {/* Content */}
                <div className="p-3">
                  <h3 className="text-base font-semibold text-gray-900 mb-1.5 group-hover:text-green-600 transition-colors">
                    {item.locations.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {item.locations.region}, {item.locations.country}
                  </p>
                  {item.locations.rating && (
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium text-gray-900">
                        {item.locations.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {item.locations.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {item.visit_date 
                        ? `Visited ${new Date(item.visit_date).toLocaleDateString()}`
                        : `Marked ${new Date(item.created_at).toLocaleDateString()}`
                      }
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

