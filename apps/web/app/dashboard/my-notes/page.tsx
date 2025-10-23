import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import { BookOpen, MapPin, UtensilsCrossed, Compass, Star, Calendar, StickyNote, Sparkles, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'My Travel Notes | TravelBlogr',
  description: 'Your personal travel diary - all your notes and memories in one place',
}

interface Note {
  id: string
  note_text: string | null
  rating: number | null
  created_at: string
  updated_at: string
}

interface LocationNote extends Note {
  location_id: string
  locations: {
    id: string
    name: string
    slug: string
    country: string
    region: string
  }
}

interface ActivityNote extends Note {
  activity_id: string
  visited_date: string | null
  activities: {
    id: string
    name: string
    location_id: string
  }
}

interface RestaurantNote extends Note {
  restaurant_id: string
  visited_date: string | null
  dish_recommendations: string | null
  restaurants: {
    id: string
    name: string
    location_id: string
  }
}

export default async function MyNotesPage() {
  const supabase = await createServerSupabase()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/signin?redirect=/dashboard/my-notes')
  }

  // Fetch all user notes
  const [locationNotesResult, activityNotesResult, restaurantNotesResult] = await Promise.all([
    supabase
      .from('user_location_notes')
      .select(`
        *,
        locations (id, name, slug, country, region)
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
    
    supabase
      .from('user_activity_notes')
      .select(`
        *,
        activities (id, name, location_id)
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
    
    supabase
      .from('user_restaurant_notes')
      .select(`
        *,
        restaurants (id, name, location_id)
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
  ])

  const locationNotes = (locationNotesResult.data || []) as LocationNote[]
  const activityNotes = (activityNotesResult.data || []) as ActivityNote[]
  const restaurantNotes = (restaurantNotesResult.data || []) as RestaurantNote[]

  const totalNotes = locationNotes.length + activityNotes.length + restaurantNotes.length

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-purple-100 rounded-lg">
            <StickyNote className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">My Travel Diary</h1>
            <p className="text-gray-600">
              All your travel memories and notes in one place
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner - Encourage Usage */}
      {totalNotes > 0 && totalNotes < 5 && (
        <Card className="p-4 mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-l-purple-500">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                💡 Keep Building Your Travel Diary!
              </h3>
              <p className="text-sm text-gray-700 mb-2">
                You've started documenting your travels - great! Add notes to more locations to build your personal travel guide.
              </p>
              <p className="text-xs text-gray-600">
                <strong>Pro tip:</strong> Notes with AI help are faster to write and more detailed!
              </p>
            </div>
          </div>
        </Card>
      )}

      {totalNotes >= 5 && (
        <Card className="p-4 mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-l-green-500">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                🎉 You're Building an Amazing Travel Collection!
              </h3>
              <p className="text-sm text-gray-700">
                {totalNotes} notes and counting! Your personal travel guide is growing. Keep exploring and documenting your adventures!
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalNotes}</p>
              <p className="text-sm text-gray-600">Total Notes</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <MapPin className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{locationNotes.length}</p>
              <p className="text-sm text-gray-600">Locations</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Compass className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activityNotes.length}</p>
              <p className="text-sm text-gray-600">Activities</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <UtensilsCrossed className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{restaurantNotes.length}</p>
              <p className="text-sm text-gray-600">Restaurants</p>
            </div>
          </div>
        </Card>
      </div>

      {totalNotes === 0 ? (
        <Card className="p-12 text-center bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
            <StickyNote className="h-10 w-10 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Start Your Travel Diary! ✨
          </h3>
          <p className="text-gray-700 mb-2 max-w-md mx-auto">
            Personal notes help you remember your experiences, plan future trips, and share tips with yourself.
          </p>
          <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
            💡 <strong>Pro tip:</strong> Add notes as you explore locations - they're private and stay with you forever!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/locations"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              <MapPin className="h-5 w-5" />
              Explore Locations
            </Link>
            <Link
              href="/trips-library"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-600 border-2 border-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium"
            >
              <Compass className="h-5 w-5" />
              Browse Trips
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Location Notes */}
          {locationNotes.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="h-6 w-6 text-green-600" />
                Location Notes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {locationNotes.map((note) => (
                  <Card key={note.id} className="p-5 hover:shadow-xl transition-all hover:scale-[1.02] border-l-4 border-l-purple-500 bg-gradient-to-br from-white to-purple-50">
                    <Link href={`/locations/${note.locations.slug}`}>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-bold text-gray-900 hover:text-purple-600 transition-colors">
                          {note.locations.name}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          Location
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 flex items-center gap-1">
                        <span>📍</span>
                        {note.locations.region}, {note.locations.country}
                      </p>
                    </Link>
                    {note.rating && (
                      <div className="flex items-center gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= note.rating!
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="text-xs text-gray-600 ml-1">
                          ({note.rating}/5)
                        </span>
                      </div>
                    )}
                    {note.note_text && (
                      <div className="bg-white p-3 rounded-lg border border-purple-100 mb-3">
                        <p className="text-gray-700 text-sm line-clamp-3">
                          {note.note_text}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-purple-100">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(note.updated_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <Link
                        href={`/locations/${note.locations.slug}`}
                        className="text-purple-600 hover:text-purple-700 font-medium"
                      >
                        View Location →
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Activity Notes */}
          {activityNotes.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Compass className="h-6 w-6 text-purple-600" />
                Activity Notes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activityNotes.map((note) => (
                  <Card key={note.id} className="p-4 hover:shadow-lg transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {note.activities.name}
                    </h3>
                    {note.rating && (
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= note.rating!
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    {note.note_text && (
                      <p className="text-gray-700 text-sm line-clamp-3 mb-2">
                        {note.note_text}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {note.visited_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Visited: {new Date(note.visited_date).toLocaleDateString()}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Updated: {new Date(note.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Restaurant Notes */}
          {restaurantNotes.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <UtensilsCrossed className="h-6 w-6 text-orange-600" />
                Restaurant Notes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {restaurantNotes.map((note) => (
                  <Card key={note.id} className="p-4 hover:shadow-lg transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {note.restaurants.name}
                    </h3>
                    {note.rating && (
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= note.rating!
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    {note.dish_recommendations && (
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Recommended:</strong> {note.dish_recommendations}
                      </p>
                    )}
                    {note.note_text && (
                      <p className="text-gray-700 text-sm line-clamp-3 mb-2">
                        {note.note_text}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {note.visited_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Visited: {new Date(note.visited_date).toLocaleDateString()}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Updated: {new Date(note.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

