'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { ViewTrackingPixel } from '@/components/analytics/ViewTrackingPixel'
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Edit2,
  Share2,
  MoreVertical,
  MapPin,
  Calendar,
  Star,
  Copy,
  Globe,
  Plus,
  Heart,
  Image as ImageIcon,
  BarChart3,
  Trash2,
  Lock,
  Users,
  Key
} from 'lucide-react'
import Link from 'next/link'
import { SmartImage as Image } from '@/components/ui/SmartImage'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { getBrowserSupabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { QuickShareModal } from '@/components/trips/QuickShareModal'
import { TripEditorModal } from '@/components/trips/TripEditorModal'
import { TripPrivacyModal } from '@/components/trips/TripPrivacyModal'

interface TripDetailsPageProps {
  params: {
    tripId: string
  }
}

export default function TripDetailsPage({ params }: TripDetailsPageProps) {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const { showSignIn } = useAuthModal()
  const router = useRouter()
  const [trip, setTrip] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [canEdit, setCanEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [existingShareLink, setExistingShareLink] = useState<any>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)

  // Single auth check effect
  useEffect(() => {
    if (!authLoading) {
      setAuthChecked(true)
      if (!isAuthenticated) {
        // Show modal instead of redirecting
        showSignIn(`/dashboard/trips/${params.tripId}`)
      }
    }
  }, [authLoading, isAuthenticated, showSignIn, params.tripId])

  // Fetch trip data - using useCallback to prevent recreation
  const fetchTrip = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const supabase = getBrowserSupabase()
      
      // First check if user has access
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
          ),
          share_links (
            id,
            subdomain,
            token,
            title,
            is_active,
            view_count,
            settings
          ),
          trip_stats (
            total_views,
            unique_views
          )
        `)
        .eq('id', params.tripId)
        .single()

      if (error) {
        // Handle different error types
        if (error.code === 'PGRST116') {
          // No rows returned
          console.error('Trip not found:', params.tripId)
          setTrip(null)
        } else if (error.code === '42501') {
          // Permission denied
          console.error('Access denied to trip:', params.tripId)
          toast.error('You do not have access to this trip')
          router.push('/dashboard/trips')
        } else {
          console.error('Error fetching trip:', error)
          toast.error('Failed to load trip')
          setTrip(null)
        }
      } else if (trip) {
        setTrip(trip)
        setCanEdit(trip.user_id === user.id)

        // Set existing share link if available
        if (trip.share_links && trip.share_links.length > 0) {
          setExistingShareLink(trip.share_links[0])
        }
      }
    } catch (error) {
      console.error('Unexpected error fetching trip:', error)
      toast.error('An unexpected error occurred')
      setTrip(null)
    } finally {
      setLoading(false)
    }
  }, [user?.id, params.tripId, router])

  // Fetch trip when user is ready
  useEffect(() => {
    if (authChecked && user?.id) {
      fetchTrip()
    }
  }, [authChecked, user?.id, fetchTrip])

  const handleCopyTemplate = async () => {
    if (!user?.id) {
      toast.error('Please sign in to copy this template')
      router.push('/auth/signin')
      return
    }

    try {
      setSaving(true)
      const supabase = getBrowserSupabase()
      
      const { data, error } = await supabase.rpc('copy_trip_template', {
        p_template_id: params.tripId,
        p_user_id: user.id
      })

      if (error) {
        console.error('RPC error:', error)
        throw error
      }

      if (!data) {
        throw new Error('No trip ID returned from copy operation')
      }

      toast.success('Template copied to your trips!')
      router.push(`/dashboard/trips/${data}`)
    } catch (error: any) {
      console.error('Error copying template:', error)
      toast.error(error.message || 'Failed to copy template')
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePublish = async () => {
    if (!canEdit || !trip) return

    try {
      setSaving(true)
      const supabase = getBrowserSupabase()
      const newStatus = trip.status === 'published' ? 'draft' : 'published'

      const { error } = await supabase
        .from('trips')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.tripId)
        .eq('user_id', user!.id) // Extra safety check

      if (error) throw error

      toast.success(newStatus === 'published' ? 'Trip published!' : 'Trip unpublished')

      // Update local state immediately for better UX
      setTrip((prev: any) => ({ ...prev, status: newStatus }))

      // Refetch to get latest data
      fetchTrip()
    } catch (error: any) {
      console.error('Error toggling publish:', error)
      toast.error(error.message || 'Failed to update trip status')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!canEdit || !trip) return

    const confirmed = confirm(`Are you sure you want to delete "${trip.title}"? This action cannot be undone.`)
    if (!confirmed) return

    try {
      setSaving(true)
      const supabase = getBrowserSupabase()

      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', params.tripId)
        .eq('user_id', user!.id) // Extra safety check

      if (error) throw error

      toast.success('Trip deleted successfully')
      router.push('/dashboard/trips')
    } catch (error: any) {
      console.error('Error deleting trip:', error)
      toast.error(error.message || 'Failed to delete trip')
    } finally {
      setSaving(false)
    }
  }

  // Show loading state while auth is checking
  if (authLoading || !authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-rausch-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading trip...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null
  }

  // Show loading while fetching trip
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-rausch-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading trip...</p>
        </div>
      </div>
    )
  }

  // Show not found state
  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Trip not found</h2>
            <p className="text-gray-600 mb-6">The trip you're looking for doesn't exist or you don't have access to it.</p>
            <Link
              href="/dashboard/trips"
              className="inline-flex items-center text-rausch-600 hover:text-rausch-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to My Trips
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const totalViews = trip.trip_stats?.[0]?.total_views || 0
  const isOwner = trip.user_id === user?.id
  const isPublicTemplate = trip.is_public_template && trip.status === 'published'

  const tripTypeColors: Record<string, string> = {
    family: 'bg-blue-100 text-blue-700',
    adventure: 'bg-green-100 text-green-700',
    beach: 'bg-orange-100 text-orange-700',
    cultural: 'bg-purple-100 text-purple-700',
    'road-trip': 'bg-red-100 text-red-700',
    solo: 'bg-indigo-100 text-indigo-700',
    romantic: 'bg-pink-100 text-pink-700',
  }

  return (
    <div className="min-h-screen bg-gray-50 text-[85%]">
      <ViewTrackingPixel tripId={params.tripId} type="trip" />

      {/* Header - Matches TravelBlogr Design */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          {/* Back Button */}
          <Link 
            href="/dashboard/trips"
            className="inline-flex items-center text-sm text-gray-600 hover:text-rausch-600 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Trips
          </Link>

          {/* Title and Actions */}
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{trip.title}</h1>
                
                {/* Status Badge */}
                {trip.status === 'published' && (
                  <span className="px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    Published
                  </span>
                )}
                {trip.status === 'draft' && (
                  <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                    Draft
                  </span>
                )}
                
                {/* Featured Badge */}
                {trip.is_featured && (
                  <span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-700" />
                    Featured
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-3">{trip.description}</p>

              {/* Meta Info */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {(trip.start_date || trip.end_date) && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {trip.start_date && new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {trip.start_date && trip.end_date && ' - '}
                      {trip.end_date && new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                )}
                {trip.destination && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{trip.destination}</span>
                  </div>
                )}
                {totalViews > 0 && (
                  <div className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{totalViews.toLocaleString()} views</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Copy Template Button */}
              {isPublicTemplate && !isOwner && (
                <button
                  onClick={handleCopyTemplate}
                  disabled={saving}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-rausch-500 hover:bg-rausch-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Copy className="w-4 h-4 mr-1.5" />
                  {saving ? 'Copying...' : 'Copy to My Trips'}
                </button>
              )}

              {/* Owner Actions */}
              {canEdit && (
                <>
                  {trip.status === 'published' ? (
                    <button
                      onClick={handleTogglePublish}
                      disabled={saving}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <EyeOff className="w-4 h-4 mr-1.5" />
                      {saving ? 'Updating...' : 'Unpublish'}
                    </button>
                  ) : (
                    <button
                      onClick={handleTogglePublish}
                      disabled={saving}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Globe className="w-4 h-4 mr-1.5" />
                      {saving ? 'Publishing...' : 'Publish'}
                    </button>
                  )}

                  <button
                    onClick={() => setShowEditModal(true)}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Edit2 className="w-4 h-4 mr-1.5" />
                    Edit
                  </button>

                  <button
                    onClick={() => setShowShareModal(true)}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Share2 className="w-4 h-4 mr-1.5" />
                    Share
                  </button>

                  {/* Privacy Settings Button */}
                  <button
                    onClick={() => setShowPrivacyModal(true)}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Privacy Settings"
                  >
                    {trip.privacy === 'private' && <Lock className="w-4 h-4 mr-1.5" />}
                    {trip.privacy === 'family' && <Users className="w-4 h-4 mr-1.5" />}
                    {trip.privacy === 'password' && <Key className="w-4 h-4 mr-1.5" />}
                    {(!trip.privacy || trip.privacy === 'public') && <Globe className="w-4 h-4 mr-1.5" />}
                    <span className="capitalize">{trip.privacy || 'Public'}</span>
                  </button>

                  {/* View Public Page / Preview - Always show */}
                  {trip.slug && (
                    <Link
                      href={`/trips/${trip.slug}${trip.status !== 'published' ? '?preview=true' : ''}`}
                      target="_blank"
                    >
                      <button className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <Eye className="w-4 h-4 mr-1.5" />
                        {trip.status === 'published' ? 'View Public Page' : 'Preview Trip'}
                      </button>
                    </Link>
                  )}

                  {/* More Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="inline-flex items-center px-2 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {showMenu && (
                      <>
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                          <Link
                            href={`/dashboard/trips/${trip.id}/edit`}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setShowMenu(false)}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit Details
                          </Link>
                          <button
                            onClick={() => {
                              setShowMenu(false)
                              handleDelete()
                            }}
                            disabled={saving}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {saving ? 'Deleting...' : 'Delete Trip'}
                          </button>
                        </div>

                        {/* Click outside to close */}
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowMenu(false)}
                        />
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="space-y-8">
          {/* Live Feed Section - Social Media Aspect */}
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl border border-rose-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Share Your Journey 🌍</h2>
                <p className="text-sm text-gray-600">Live updates from this trip</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live</span>
              </div>
            </div>

            {/* Live Feed Component */}
            <div className="bg-white rounded-xl p-4 min-h-[200px]">
              {trip.posts && trip.posts.length > 0 ? (
                <div className="space-y-3">
                  {trip.posts.slice(0, 3).map((post: any) => (
                    <div key={post.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      {post.featured_image && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={post.featured_image}
                            alt={post.title}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm mb-1">{post.title}</h3>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {post.content?.substring(0, 100)}...
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {new Date(post.post_date || post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {post.location && (
                            <>
                              <span>•</span>
                              <MapPin className="w-3 h-3" />
                              {post.location}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">No updates yet</p>
                  <p className="text-xs text-gray-500">Start sharing your journey!</p>
                </div>
              )}
            </div>
          </div>

          {/* Trip Timeline - Location Cards (Matching Landing Page Style) */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Trip Timeline</h2>
              <p className="text-gray-600">Explore each destination on this journey</p>
            </div>

            {/* Location Cards Grid - Exact same style as FeaturedLocations */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {trip.posts && trip.posts.length > 0 ? (
                trip.posts.map((post: any, index: number) => {
                  // Try to find matching location for linking
                  const locationSlug = post.location?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

                  return (
                    <Link
                      key={post.id}
                      href={locationSlug ? `/locations/${locationSlug}` : '#'}
                      className="group block"
                    >
                      <Card className="overflow-hidden hover:shadow-airbnb-large transition-all duration-300 group-hover:scale-[1.02]">
                        {/* Location Image */}
                        <div className="relative h-64 overflow-hidden">
                          {post.featured_image ? (
                            <img
                              src={post.featured_image}
                              alt={post.location || post.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                              <MapPin className="h-12 w-12 text-blue-400" />
                            </div>
                          )}

                          {/* Day Badge */}
                          <Badge className="absolute top-3 left-3 bg-teal-500 text-white">
                            Day {index + 1}
                          </Badge>

                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          {/* Hover Content */}
                          <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="flex items-center gap-2 text-sm">
                              <ArrowRight className="h-4 w-4" />
                              <span>Explore {post.location || 'Location'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Location Info */}
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold text-airbnb-black mb-1 group-hover:text-rausch-500 transition-colors">
                                {post.location || post.title}
                              </h3>
                              <div className="flex items-center gap-1 text-airbnb-gray text-sm">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {new Date(post.post_date || post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          </div>

                          <p className="text-airbnb-dark-gray text-sm mb-4 line-clamp-2">
                            {post.content?.substring(0, 120) || 'Explore this amazing destination...'}
                          </p>

                          {/* Stats */}
                          <div className="flex items-center justify-between text-xs text-airbnb-gray">
                            <div className="flex items-center gap-1">
                              <ImageIcon className="h-3 w-3" />
                              <span>{post.featured_image ? '1 photo' : 'No photos'}</span>
                            </div>
                            {canEdit && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  toast.success('Edit post coming soon!')
                                }}
                                className="flex items-center gap-1 text-rausch-500 hover:text-rausch-600"
                              >
                                <Edit2 className="h-3 w-3" />
                                <span>Edit</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  )
                })
              ) : (
                <div className="col-span-full text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <MapPin className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No locations yet</h3>
                  <p className="text-gray-600 mb-6">Start building your trip timeline by adding locations</p>
                  {canEdit && (
                    <button
                      onClick={() => toast.success('Add location coming soon!')}
                      className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-rausch-500 hover:bg-rausch-600 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Location
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* About This Trip */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">About This Trip</h2>
              {canEdit && (
                <Link href={`/dashboard/trips/${trip.id}/edit`}>
                  <button className="text-sm text-rausch-600 hover:text-rausch-700 font-medium">
                    Edit Details
                  </button>
                </Link>
              )}
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {trip.description || 'No description yet. Click Edit Details to add information about your trip.'}
            </p>

            {/* Trip Details Grid */}
            {(trip.destination || trip.duration_days || trip.trip_type) && (
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
                {trip.destination && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Destination</div>
                    <div className="text-sm font-medium text-gray-900">{trip.destination}</div>
                  </div>
                )}
                {trip.duration_days && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Duration</div>
                    <div className="text-sm font-medium text-gray-900">{trip.duration_days} days</div>
                  </div>
                )}
                {trip.trip_type && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Type</div>
                    <div className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize ${tripTypeColors[trip.trip_type] || 'bg-gray-100 text-gray-700'}`}>
                      {trip.trip_type.replace('-', ' ')}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Highlights */}
            {trip.highlights && trip.highlights.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Highlights</h3>
                <div className="flex flex-wrap gap-2">
                  {trip.highlights.map((highlight: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-50 text-gray-700 text-xs rounded-full border border-gray-200"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Share Modal */}
      <QuickShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        tripId={trip.id}
        tripTitle={trip.title}
        existingShareLink={existingShareLink}
      />

      {/* Trip Editor Modal */}
      {showEditModal && (
        <TripEditorModal
          trip={trip}
          onClose={() => setShowEditModal(false)}
          onUpdate={fetchTrip}
        />
      )}

      {/* Privacy Settings Modal */}
      <TripPrivacyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        tripId={trip.id}
        currentPrivacy={trip.privacy || 'public'}
        onUpdate={(privacy) => {
          setTrip({ ...trip, privacy })
        }}
      />
    </div>
  )
}
