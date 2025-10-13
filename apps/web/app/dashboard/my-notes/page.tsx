import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import { BookOpen, MapPin, UtensilsCrossed, Compass, Star, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'

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
  const supabase = createServerSupabase()
  
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
          <BookOpen className="h-8 w-8 text-rausch-500" />
          <h1 className="text-4xl font-bold text-gray-900">My Travel Diary</h1>
        </div>
        <p className="text-gray-600">
          All your travel memories and notes in one place
        </p>
      </div>

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
        <Card className="p-12 text-center">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No notes yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start exploring locations and add your first travel note!
          </p>
          <Link
            href="/locations"
            className="inline-flex items-center gap-2 px-6 py-3 bg-rausch-500 text-white rounded-lg hover:bg-rausch-600 transition-colors"
          >
            <MapPin className="h-5 w-5" />
            Explore Locations
          </Link>
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
                  <Card key={note.id} className="p-4 hover:shadow-lg transition-shadow">
                    <Link href={`/locations/${note.locations.slug}`}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 hover:text-rausch-500">
                        {note.locations.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {note.locations.region}, {note.locations.country}
                      </p>
                    </Link>
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
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(note.updated_at).toLocaleDateString()}
                    </p>
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

