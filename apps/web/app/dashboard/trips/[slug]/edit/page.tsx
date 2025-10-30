'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getBrowserSupabase } from '@/lib/supabase'
import { ResultsView } from '@/components/trip-planner-v2/ResultsView'
import { QuickShareModal } from '@/components/trips/QuickShareModal'
import { TripPrivacyModal } from '@/components/trips/TripPrivacyModal'
import { Button } from '@/components/ui/Button'
import { Share2, Globe, Lock, Users, Key, Trash2 } from 'lucide-react'

interface TripEditPageProps {
  params: {
    slug: string
  }
}

export default function TripEditPage({ params }: TripEditPageProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [trip, setTrip] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [deleting, setDeleting] = useState(false)

  // Trip basic info state
  const [tripData, setTripData] = useState({
    title: '',
    description: '',
    cover_image: ''
  })
  // V2 editor state
  const [v2Plan, setV2Plan] = useState<any>(null)
  // Share modal state
  const [shareOpen, setShareOpen] = useState(false)
  // Privacy modal state
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)

  const [existingShareLink, setExistingShareLink] = useState<any>(null)

  // One-time first-visit tip for editor (per trip)
  const [showEditorTip, setShowEditorTip] = useState(false)
  useEffect(() => {
    const key = `tb:editor-tip:v2:${params.slug}`
    try {
      if (typeof window !== 'undefined') {
        const seen = localStorage.getItem(key)
        if (!seen) setShowEditorTip(true)
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.slug])
  const dismissEditorTip = () => {
    const key = `tb:editor-tip:v2:${params.slug}`
    try {
      if (typeof window !== 'undefined') localStorage.setItem(key, '1')
    } catch {}
    setShowEditorTip(false)
  }

  // Fetch existing share links (reuse existing API)
  const fetchShareLinks = async () => {
    if (!trip?.id) return
    try {
      const res = await fetch(`/api/trips/${trip.id}/share-links`)
      if (res.ok) {
        const { shareLinks } = await res.json()
        const active = Array.isArray(shareLinks)
          ? (shareLinks.find((l: any) => l.is_active) || shareLinks[0] || null)
          : null
        setExistingShareLink(active)
      }
    } catch (e) {
      console.warn('Failed to fetch share links', e)
    }
  }

  const [v2TripData, setV2TripData] = useState<any>(null)
  const [v2LocationImages, setV2LocationImages] = useState<Record<string, { featured: string; gallery: string[] }>>({})


  // Refresh share link info when opening share modal
  useEffect(() => {
    if (shareOpen && trip?.id) {
      fetchShareLinks()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareOpen, trip?.id])

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
  }, [user?.id, params.slug])

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
        .eq('slug', params.slug)
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

      // Ensure privacy field exists (default to 'public' if null)
      setTrip({ ...trip, privacy: trip.privacy || 'public' })
      setTripData({
        title: trip.title || '',
        description: trip.description || '',
        cover_image: trip.cover_image || ''
      })

      // Load V2 plan data if available; otherwise derive a minimal plan from trip
      try {
        const { data: planRow } = await supabase
          .from('trip_plan')
          .select('plan_data')
          .eq('trip_id', trip.id)
          .eq('type', 'ai_plan_v2')
          .single()

        const planData = planRow?.plan_data as any | undefined

        if (planData) {
          setV2Plan(planData)

          // Ensure dateRange dates are Date objects (not strings from DB)
          const tripDataFromDB = planData.tripData || {}
          const normalizedTripData = {
            ...tripDataFromDB,
            dateRange: tripDataFromDB.dateRange
              ? {
                  startDate: tripDataFromDB.dateRange.startDate instanceof Date
                    ? tripDataFromDB.dateRange.startDate
                    : new Date(tripDataFromDB.dateRange.startDate),
                  endDate: tripDataFromDB.dateRange.endDate instanceof Date
                    ? tripDataFromDB.dateRange.endDate
                    : new Date(tripDataFromDB.dateRange.endDate),
                }
              : (trip.start_date && trip.end_date
                  ? {
                      startDate: new Date(trip.start_date),
                      endDate: new Date(trip.end_date),
                    }
                  : null),
          }

          setV2TripData(normalizedTripData)
          setV2LocationImages(planData.locationImages || {})
        } else {
          // Minimal fallback from trip.location_data
          const fallbackPlan = {
            title: trip.title || 'Untitled Trip',
            summary: trip.description || '',
            days:
              trip.location_data?.days ||
              [
                {
                  day: 1,
                  location: 'Add destination',
                  locationMetadata: null,
                  schedule: [],
                  stops: [],
                  items: [],
                  duration: null,
                  distance: null,
                },
              ],
            stats: {
              totalDays: trip.location_data?.days?.length || 1,
              totalDistance: 0,
              totalActivities: 0,
            },
          }
          const fallbackTripData = {
            destinations: [],
            dateRange:
              trip.start_date && trip.end_date
                ? {
                    startDate: new Date(trip.start_date),
                    endDate: new Date(trip.end_date),
                  }
                : null,
            tripType: 'road-trip',
            travelStyle: 'balanced',
            budget: 'moderate',
            pace: 'moderate',
            interests: [],
          }
          setV2Plan(fallbackPlan)
          setV2TripData(fallbackTripData)
          setV2LocationImages({})
        }
      } catch (e) {
        console.warn('Failed to load V2 plan_data; using fallback', e)
        const fallbackPlan = {
          title: trip.title || 'Untitled Trip',
          summary: trip.description || '',
          days:
            trip.location_data?.days ||
            [
              {
                day: 1,
                location: 'Add your first destination',
                locationMetadata: null,
                schedule: [],
                stops: [],
                duration: null,
                distance: null,
              },
            ],


          stats: {
            totalDays: trip.location_data?.days?.length || 1,
            totalDistance: 0,
            totalActivities: 0,
          },
        }
        const fallbackTripData = {
          destinations: [],
          dateRange:
            trip.start_date && trip.end_date
              ? {
                  startDate: new Date(trip.start_date),
                  endDate: new Date(trip.end_date),
                }
              : null,
          tripType: 'road-trip',
          travelStyle: 'balanced',
          budget: 'moderate',
          pace: 'moderate',
          interests: [],
        }
        setV2Plan(fallbackPlan)
        setV2TripData(fallbackTripData)
        setV2LocationImages({})
      }

      // Fetch share links after trip is loaded
      if (trip?.id) {
        fetchShareLinks()
      }
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
        tripId: trip?.id,
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
        .eq('id', trip?.id || '')
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
  // Keep reference to avoid unused warning when V2 editor is active
  useEffect(() => {
    void handleSaveTripInfo
  }, [])

  const handleDeleteTrip = async () => {
    if (!trip?.id) return
    const confirmed = confirm('Delete this trip? This action cannot be undone.')
    if (!confirmed) return

    try {
      setDeleting(true)
      const supabase = getBrowserSupabase()
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', trip.id)
        .eq('user_id', user?.id || '')

      if (error) {
        console.error('Failed to delete trip', error)
        alert('Failed to delete trip')
        return
      }

      router.push('/dashboard/trips')
    } catch (e) {
      console.error('Failed to delete trip', e)
      alert('Failed to delete trip')
    } finally {
      setDeleting(false)
    }
  }


  // Load existing share link once trip is available
  useEffect(() => {
    if (trip?.id) {
      fetchShareLinks()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.id])

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


  return (
    <div className="min-h-screen bg-white">
      {/* Minimal, sleek top bar with Share button - reusing existing sharing system */}
      <div className="sticky top-0 z-30 bg-white/70 backdrop-blur border-b border-gray-100">
        <div className="max-w-[1610px] mx-auto flex items-center justify-end p-3 gap-2">
          {/* Privacy Settings */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPrivacyModal(true)}
            className="rounded-full text-gray-700 hover:bg-gray-100 gap-2"
            aria-label="Privacy settings"
          >
            {trip.privacy === 'private' && <Lock className="h-4 w-4" />}
            {trip.privacy === 'family' && <Users className="h-4 w-4" />}
            {trip.privacy === 'password' && <Key className="h-4 w-4" />}
            {(!trip.privacy || trip.privacy === 'public') && <Globe className="h-4 w-4" />}
            <span className="text-sm capitalize">{trip.privacy || 'public'}</span>
          </Button>

          {/* Delete Trip */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteTrip}
            disabled={deleting}
            className="rounded-full text-gray-700 hover:bg-gray-100 gap-2"
            aria-label="Delete trip"
          >
            <Trash2 className="h-4 w-4" />
            <span className="text-sm">{deleting ? 'Deleting…' : 'Delete'}</span>
          </Button>

          {/* Share */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShareOpen(true)}
            className="rounded-full text-gray-700 hover:bg-gray-100 gap-2"
            aria-label="Share trip"
          >
            <Share2 className="h-4 w-4" />
            <span className="text-sm">Share</span>
          </Button>
        </div>
      </div>

      {/* First-visit tip (editor) */}
      {showEditorTip && (
        <div className="max-w-[1610px] mx-auto px-4">
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 text-sm p-3 flex items-start justify-between gap-3">
            <div className="leading-relaxed">
              You're in Edit Mode — click a location name to change it, and use "Edit" on photos to update images. All changes auto-save.
            </div>
            <button
              type="button"
              onClick={dismissEditorTip}
              className="shrink-0 inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs hover:bg-emerald-700"
              aria-label="Dismiss tip"
            >
              Got it
            </button>
          </div>
        </div>
      )}
      {/* Privacy Settings Modal */}
      <TripPrivacyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        tripId={trip?.id || ''}
        currentPrivacy={trip.privacy || 'public'}
        onUpdate={(privacy) => {
          setTrip({ ...trip, privacy })
        }}
      />


      {/* Unified V2 Editor */}
      <ResultsView
        plan={v2Plan}
        tripData={v2TripData}
        locationImages={v2LocationImages}
        structuredContext={null}
        groqHeadline={(v2Plan && (v2Plan.tripTitle || v2Plan.title)) || trip.title || ''}
        groqSubtitle={(v2Plan && v2Plan.tripSubtitle) || trip.description || ''}
        generationMode="standard"
        onEdit={() => {}}
        initialTripId={trip?.id || ''}
        mode="editor"
      />

      {/* Quick Share Modal (reused) */}
      <QuickShareModal
        isOpen={shareOpen}

        onClose={() => setShareOpen(false)}
        tripId={trip?.id || ''}
        tripTitle={tripData.title || trip.title || 'Untitled Trip'}
        existingShareLink={existingShareLink}
      />
    </div>
  )
}

