import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Heart, MapPin, Calendar, TrendingUp, Sparkles, Compass, Star } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Image from 'next/image'
import { OverlayAction } from '@/components/wishlist/OverlayAction'
import { CollectionsBar } from '@/components/wishlist/CollectionsBar'

export const metadata = {
  title: 'My Wishlist | TravelBlogr',
  description: 'Your saved travel destinations and dream locations'
}

interface WishlistLocation {
  id: string
  location_id: string
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

export default async function MyWishlistPage() {
  const supabase = await createServerSupabase()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/signin?redirect=/dashboard/my-wishlist')
  }

  // Fetch wishlisted locations
  const { data: wishlistData, error } = await supabase
    .from('user_locations')
    .select(`
      id,
      location_id,
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
    .eq('is_wishlisted', true)
    .order('updated_at', { ascending: false })

  const wishlist = (wishlistData || []) as unknown as WishlistLocation[]

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-red-100 rounded-lg">
            <Heart className="h-8 w-8 text-red-600 fill-current" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
            <p className="text-gray-600">
              Your dream destinations and places you want to visit
            </p>
          </div>
        </div>
      </div>

      {/* Collections */}
      <CollectionsBar />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Heart className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Saved</p>
              <p className="text-2xl font-bold text-gray-900">{wishlist.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Countries</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(wishlist.map(w => w.locations.country)).size}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {wishlist.filter(w => {
                  const date = new Date(w.created_at)
                  const now = new Date()
                  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
                }).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Motivational Banner */}
      {wishlist.length > 0 && wishlist.length < 5 && (
        <Card className="p-4 mb-6 bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-l-red-500">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                💡 Start Building Your Dream Travel List!
              </h3>
              <p className="text-sm text-gray-700">
                You've saved {wishlist.length} {wishlist.length === 1 ? 'location' : 'locations'}. Keep exploring and adding places you want to visit!
              </p>
            </div>
          </div>
        </Card>
      )}

      {wishlist.length >= 10 && (
        <Card className="p-4 mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-l-purple-500">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                🎉 Wow! You're a True Explorer!
              </h3>
              <p className="text-sm text-gray-700">
                {wishlist.length} locations on your wishlist! Time to start planning your next adventure!
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Wishlist Grid */}
      {wishlist.length === 0 ? (
        <Card className="p-12 text-center bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <Heart className="h-10 w-10 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Start Your Wishlist! ❤️
          </h3>
          <p className="text-gray-700 mb-2 max-w-md mx-auto">
            Save locations you want to visit and build your dream travel list.
          </p>
          <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
            💡 <strong>Pro tip:</strong> Click the bookmark icon on any location page to add it to your wishlist!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/locations"
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <MapPin className="h-5 w-5" />
              Explore Locations
            </Link>
            <Link
              href="/trips-library"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-red-600 border-2 border-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
            >
              <Compass className="h-5 w-5" />
              Browse Trips
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {wishlist.map((item) => (
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
                    <div className="w-full h-full bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center">
                      <MapPin className="h-12 w-12 text-red-400" />
                    </div>
                  )}
                  <OverlayAction slug={item.locations.slug} variant="wishlist" />
                </div>

                {/* Content */}
                <div className="p-3">
                  <h3 className="text-base font-semibold text-gray-900 mb-1.5 group-hover:text-red-600 transition-colors">
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
                      Added {new Date(item.created_at).toLocaleDateString()}
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

