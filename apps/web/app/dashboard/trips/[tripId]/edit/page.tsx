'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { 
  Image as ImageIcon, 
  MapPin, 
  Hotel, 
  Users, 
  Settings, 
  Lock, 
  Navigation,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  Plus,
  Save,
  X,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { getBrowserSupabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface TripEditPageProps {
  params: {
    tripId: string
  }
}

type SidebarSection = 
  | 'hero' 
  | 'landscapes' 
  | 'privacy' 
  | 'tracking' 
  | 'restaurants' 
  | 'people' 
  | 'locations' 
  | 'images' 
  | 'quick-actions'

export default function TripEditPage({ params }: TripEditPageProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [trip, setTrip] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<SidebarSection>('locations')
  const [expandedSections, setExpandedSections] = useState<string[]>(['locations'])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin')
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (user) {
      fetchTrip()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, params.tripId])

  const fetchTrip = async () => {
    try {
      const supabase = getBrowserSupabase()

      const { data: trip, error } = await supabase
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
          )
        `)
        .eq('id', params.tripId)
        .single()

      if (error) {
        console.error('Error fetching trip:', error)
        toast.error('Failed to load trip')
        router.push('/dashboard/trips')
        return
      }

      // Check if user owns this trip
      if (trip.user_id !== user?.id) {
        toast.error('You do not have permission to edit this trip')
        router.push('/dashboard/trips')
        return
      }

      setTrip(trip)
    } catch (error) {
      console.error('Error fetching trip:', error)
      toast.error('Failed to load trip')
      router.push('/dashboard/trips')
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rausch-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trip editor...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user || !trip) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <Link 
            href={`/dashboard/trips/${params.tripId}`}
            className="flex items-center text-sm text-gray-600 hover:text-rausch-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Trip
          </Link>
        </div>

        <nav className="p-4 space-y-1">
          <button
            onClick={() => setActiveSection('hero')}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeSection === 'hero'
                ? 'bg-rausch-50 text-rausch-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <ImageIcon className="w-5 h-5 mr-3" />
            Hero-Bilder
          </button>

          <button
            onClick={() => setActiveSection('landscapes')}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeSection === 'landscapes'
                ? 'bg-rausch-50 text-rausch-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <ImageIcon className="w-5 h-5 mr-3" />
            Landschaften
          </button>

          <button
            onClick={() => setActiveSection('privacy')}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeSection === 'privacy'
                ? 'bg-rausch-50 text-rausch-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Lock className="w-5 h-5 mr-3" />
            Privacy
          </button>

          <button
            onClick={() => setActiveSection('tracking')}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeSection === 'tracking'
                ? 'bg-rausch-50 text-rausch-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Navigation className="w-5 h-5 mr-3" />
            GPS Tracking
          </button>

          <button
            onClick={() => setActiveSection('restaurants')}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeSection === 'restaurants'
                ? 'bg-rausch-50 text-rausch-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Hotel className="w-5 h-5 mr-3" />
            Restaurants & Hotels
          </button>

          <button
            onClick={() => setActiveSection('people')}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeSection === 'people'
                ? 'bg-rausch-50 text-rausch-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Users className="w-5 h-5 mr-3" />
            Personen
          </button>

          <button
            onClick={() => setActiveSection('locations')}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeSection === 'locations'
                ? 'bg-rausch-50 text-rausch-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <MapPin className="w-5 h-5 mr-3" />
            Orte
          </button>

          <button
            onClick={() => setActiveSection('images')}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeSection === 'images'
                ? 'bg-rausch-50 text-rausch-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <ImageIcon className="w-5 h-5 mr-3" />
            Bilder
          </button>

          <button
            onClick={() => setActiveSection('quick-actions')}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeSection === 'quick-actions'
                ? 'bg-rausch-50 text-rausch-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Settings className="w-5 h-5 mr-3" />
            Schnellaktionen
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{trip.title}</h1>
            <p className="text-gray-600">Bearbeite deine Reise</p>
          </div>

          {/* Content based on active section */}
          {activeSection === 'locations' && (
            <div className="space-y-6">
              {/* Orte verwalten Section */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleSection('locations-manage')}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <h2 className="text-base font-semibold text-gray-900">Orte verwalten</h2>
                  {expandedSections.includes('locations-manage') ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {expandedSections.includes('locations-manage') && (
                  <div className="p-4 border-t border-gray-200 space-y-3">
                    {trip.posts && trip.posts.length > 0 ? (
                      trip.posts.map((post: any) => (
                        <div
                          key={post.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900">{post.title}</h3>
                            {post.post_date && (
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(post.post_date).toLocaleDateString('de-DE')}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="p-1.5 hover:bg-white rounded transition-colors">
                              <Edit2 className="w-4 h-4 text-gray-600" />
                            </button>
                            <button className="p-1.5 hover:bg-white rounded transition-colors">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Keine Orte vorhanden
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Floating Add Button */}
              <button className="fixed bottom-8 right-8 w-14 h-14 bg-teal-500 hover:bg-teal-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110">
                <Plus className="w-6 h-6" />
              </button>
            </div>
          )}

          {/* Other sections - Placeholders */}
          {activeSection !== 'locations' && (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-500">
                {activeSection.charAt(0).toUpperCase() + activeSection.slice(1).replace('-', ' ')} - Coming soon
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

