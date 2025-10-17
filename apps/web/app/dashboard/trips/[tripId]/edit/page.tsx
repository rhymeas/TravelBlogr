'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { getBrowserSupabase } from '@/lib/supabase'
import { SimpleTripEditor } from '@/components/trips/SimpleTripEditor'
import { Button } from '@/components/ui/Button'

interface TripEditPageProps {
  params: {
    tripId: string
  }
}

export default function TripEditPage({ params }: TripEditPageProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [trip, setTrip] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Trip basic info state
  const [tripData, setTripData] = useState({
    title: '',
    description: '',
    cover_image: ''
  })

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
        alert('Failed to load trip')
        router.push('/dashboard/trips')
        return
      }

      // Check if user owns this trip
      if (trip.user_id !== user?.id) {
        alert('You do not have permission to edit this trip')
        router.push('/dashboard/trips')
        return
      }

      setTrip(trip)
      setTripData({
        title: trip.title || '',
        description: trip.description || '',
        cover_image: trip.cover_image || ''
      })
    } catch (error) {
      console.error('Error fetching trip:', error)
      alert('Failed to load trip')
      router.push('/dashboard/trips')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTripInfo = async () => {
    if (!user) {
      alert('You must be logged in to save changes')
      return
    }

    try {
      setSaving(true)
      const supabase = getBrowserSupabase()

      console.log('Saving trip info:', {
        tripId: params.tripId,
        userId: user.id,
        title: tripData.title,
        cover_image: tripData.cover_image
      })

      const { data, error } = await supabase
        .from('trips')
        .update({
          title: tripData.title,
          description: tripData.description,
          cover_image: tripData.cover_image,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.tripId)
        .eq('user_id', user.id) // Ensure user owns the trip
        .select()

      console.log('Update result:', { data, error })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      if (!data || data.length === 0) {
        throw new Error('Trip not found or you do not have permission to edit it')
      }

      alert('Trip info updated!')
      await fetchTrip()
    } catch (error: any) {
      console.error('Error updating trip:', error)
      alert(error.message || 'Failed to update trip')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trip editor...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user || !trip) {
    return null
  }

  const sortedPosts = trip.posts ? [...trip.posts].sort((a: any, b: any) => a.order_index - b.order_index) : []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href={`/dashboard/trips/${params.tripId}`}
                className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Trip
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-lg font-semibold text-gray-900">{trip.title}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Trip Basic Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Trip Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={tripData.title}
                  onChange={(e) => setTripData({ ...tripData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Trip title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={tripData.description}
                  onChange={(e) => setTripData({ ...tripData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Describe your trip..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  value={tripData.cover_image}
                  onChange={(e) => setTripData({ ...tripData, cover_image: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://images.unsplash.com/..."
                />
                {tripData.cover_image && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={tripData.cover_image}
                      alt="Cover preview"
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-trip.jpg'
                      }}
                    />
                  </div>
                )}
              </div>

              <Button
                onClick={handleSaveTripInfo}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Trip Info'}
              </Button>
            </div>
          </div>

          {/* Locations Editor */}
          <SimpleTripEditor
            tripId={params.tripId}
            trip={trip}
            locations={sortedPosts}
            onUpdate={fetchTrip}
          />
        </div>
      </div>
    </div>
  )
}

