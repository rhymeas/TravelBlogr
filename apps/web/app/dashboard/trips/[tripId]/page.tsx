'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { ViewTrackingPixel } from '@/components/analytics/ViewTrackingPixel'
import {
  ArrowLeft,
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
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import { SmartImage as Image } from '@/components/ui/SmartImage'
import { getBrowserSupabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface TripDetailsPageProps {
  params: {
    tripId: string
  }
}

export default function TripDetailsPage({ params }: TripDetailsPageProps) {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [trip, setTrip] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [canEdit, setCanEdit] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [saving, setSaving] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  // Single auth check effect
  useEffect(() => {
    if (!authLoading) {
      setAuthChecked(true)
      if (!isAuthenticated) {
        // Add small delay to prevent flash
        const timer = setTimeout(() => {
          router.push('/auth/signin')
        }, 100)
        return () => clearTimeout(timer)
      }
    }
  }, [authLoading, isAuthenticated, router])

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
            link_type,
            token,
            title,
            is_active,
            view_count
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

  // Show loading state while auth is checking
  if (authLoading || !authChecked) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
            <div className="h-32 bg-gray-200 rounded-xl"></div>
          </div>
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
            <div className="h-32 bg-gray-200 rounded-xl"></div>
          </div>
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

                  <Link href={`/dashboard/trips/${trip.id}/edit`}>
                    <button className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <Edit2 className="w-4 h-4 mr-1.5" />
                      Edit
                    </button>
                  </Link>

                  <button className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Share2 className="w-4 h-4 mr-1.5" />
                    Share
                  </button>

                  <button className="inline-flex items-center px-2 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* View Public Page */}
              {trip.status === 'published' && trip.slug && (
                <Link href={`/trips/${trip.slug}`} target="_blank">
                  <button className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Eye className="w-4 h-4 mr-1.5" />
                    View
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'posts', label: 'Posts' },
              { id: 'settings', label: 'Settings' },
              { id: 'images', label: 'Images' },
              { id: 'map', label: 'Map' },
              { id: 'share', label: 'Share' },
              { id: 'analytics', label: 'Analytics' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-rausch-500 text-rausch-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Cover Image */}
            {trip.cover_image && (
              <div className="relative w-full h-64 rounded-xl overflow-hidden shadow-sm">
                <Image
                  src={trip.cover_image}
                  alt={trip.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

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

            {/* Quick Actions */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              <button
                onClick={() => setActiveTab('posts')}
                className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-gray-200 hover:border-rausch-300 hover:bg-rausch-50 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2 group-hover:bg-blue-200 transition-colors">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-gray-700">Posts</span>
                <span className="text-xs text-gray-500">{trip.posts?.length || 0}</span>
              </button>

              <button
                onClick={() => setActiveTab('map')}
                className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-gray-200 hover:border-rausch-300 hover:bg-rausch-50 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-2 group-hover:bg-green-200 transition-colors">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-xs font-medium text-gray-700">Map</span>
              </button>

              <button className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-gray-200 hover:border-rausch-300 hover:bg-rausch-50 transition-all group">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center mb-2 group-hover:bg-pink-200 transition-colors">
                  <Heart className="w-5 h-5 text-pink-600" />
                </div>
                <span className="text-xs font-medium text-gray-700">Favorites</span>
              </button>

              <button className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-gray-200 hover:border-rausch-300 hover:bg-rausch-50 transition-all group">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mb-2 group-hover:bg-purple-200 transition-colors">
                  <ImageIcon className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-xs font-medium text-gray-700">Photos</span>
              </button>

              <button
                onClick={() => setActiveTab('share')}
                className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-gray-200 hover:border-rausch-300 hover:bg-rausch-50 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mb-2 group-hover:bg-orange-200 transition-colors">
                  <Share2 className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-xs font-medium text-gray-700">Share</span>
                <span className="text-xs text-gray-500">{trip.share_links?.length || 0}</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-gray-200 hover:border-rausch-300 hover:bg-rausch-50 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center mb-2 group-hover:bg-teal-200 transition-colors">
                  <BarChart3 className="w-5 h-5 text-teal-600" />
                </div>
                <span className="text-xs font-medium text-gray-700">Analytics</span>
                <span className="text-xs text-gray-500">{totalViews}</span>
              </button>
            </div>

            {/* Recent Posts */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">Recent Travel Stories</h2>
                <button
                  onClick={() => setActiveTab('posts')}
                  className="text-sm text-rausch-600 hover:text-rausch-700 font-medium"
                >
                  View all
                </button>
              </div>

              {trip.posts && trip.posts.length > 0 ? (
                <div className="space-y-3">
                  {trip.posts.slice(0, 5).map((post: any) => (
                    <div key={post.id} className="p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-200">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm mb-1 truncate">{post.title}</h3>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {post.content?.substring(0, 120)}...
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <p className="text-xs text-gray-500">
                              {new Date(post.post_date || post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                            {post.location && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {post.location}
                              </span>
                            )}
                          </div>
                        </div>
                        {canEdit && (
                          <button className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                            <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">No posts yet</p>
                  <p className="text-xs text-gray-500 mb-4">Start documenting your journey!</p>
                  {canEdit && (
                    <button
                      onClick={() => setActiveTab('posts')}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-rausch-500 hover:bg-rausch-600 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Add First Post
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Posts Tab - Integrated CMS */}
        {activeTab === 'posts' && canEdit && (
          <div className="space-y-6">
            {/* Add New Post Button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Manage Posts</h2>
                <p className="text-sm text-gray-600 mt-1">Add and edit your travel stories</p>
              </div>
              <button
                onClick={() => {
                  // Will implement add post modal
                  toast.success('Add post functionality coming soon!')
                }}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-rausch-500 hover:bg-rausch-600 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Post
              </button>
            </div>

            {/* Posts List */}
            {trip.posts && trip.posts.length > 0 ? (
              <div className="grid gap-4">
                {trip.posts.map((post: any, index: number) => (
                  <div
                    key={post.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-rausch-100 text-rausch-600 text-sm font-semibold">
                            {index + 1}
                          </span>
                          <h3 className="text-base font-semibold text-gray-900">{post.title}</h3>
                        </div>

                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {post.content?.substring(0, 200)}...
                        </p>

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {post.post_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>
                                {new Date(post.post_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          )}
                          {post.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{post.location}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            // Will implement edit post modal
                            toast.success('Edit post functionality coming soon!')
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit post"
                        >
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this post?')) {
                              // Will implement delete
                              toast.success('Delete functionality coming soon!')
                            }
                          }}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete post"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">No posts yet</h3>
                <p className="text-sm text-gray-600 mb-6">Start documenting your journey by adding your first post</p>
                <button
                  onClick={() => {
                    toast.success('Add post functionality coming soon!')
                  }}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-rausch-500 hover:bg-rausch-600 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add First Post
                </button>
              </div>
            )}
          </div>
        )}

        {/* Posts Tab - Read-only for non-owners */}
        {activeTab === 'posts' && !canEdit && (
          <div className="space-y-4">
            {trip.posts && trip.posts.length > 0 ? (
              trip.posts.map((post: any, index: number) => (
                <div
                  key={post.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-rausch-100 text-rausch-600 text-sm font-semibold flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 mb-2">{post.title}</h3>
                      <p className="text-sm text-gray-700 leading-relaxed mb-3">{post.content}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {post.post_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {new Date(post.post_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        )}
                        {post.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{post.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">No posts yet</p>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab - Trip Details Editor */}
        {activeTab === 'settings' && canEdit && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Trip Settings</h2>
              <p className="text-sm text-gray-600">Manage your trip details and preferences</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Basic Information</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trip Title
                  </label>
                  <input
                    type="text"
                    value={trip.title}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                    placeholder="Enter trip title"
                  />
                  <p className="text-xs text-gray-500 mt-1">Edit in the header above</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={trip.description || ''}
                    readOnly
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                    placeholder="Describe your trip..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Destination
                    </label>
                    <input
                      type="text"
                      value={trip.destination || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                      placeholder="e.g., Paris, France"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (days)
                    </label>
                    <input
                      type="number"
                      value={trip.duration_days || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                      placeholder="7"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={trip.start_date || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={trip.end_date || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trip Type
                  </label>
                  <select
                    value={trip.trip_type || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                  >
                    <option value="">Select type</option>
                    <option value="family">Family</option>
                    <option value="adventure">Adventure</option>
                    <option value="beach">Beach</option>
                    <option value="cultural">Cultural</option>
                    <option value="road-trip">Road Trip</option>
                    <option value="solo">Solo</option>
                    <option value="romantic">Romantic</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <Link href={`/dashboard/trips/${trip.id}/edit`}>
                    <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-rausch-500 hover:bg-rausch-600 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4 mr-1.5" />
                      Edit Trip Details
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Privacy & Visibility</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Trip Status</p>
                    <p className="text-xs text-gray-500">Control who can see this trip</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    trip.status === 'published'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {trip.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Public Template</p>
                    <p className="text-xs text-gray-500">Allow others to copy this trip</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    trip.is_public_template
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {trip.is_public_template ? 'Yes' : 'No'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Featured Trip</p>
                    <p className="text-xs text-gray-500">Highlight in trips library</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    trip.is_featured
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {trip.is_featured ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Images Tab - Cover Image & Gallery */}
        {activeTab === 'images' && canEdit && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Trip Images</h2>
              <p className="text-sm text-gray-600">Manage your trip cover image and photo gallery</p>
            </div>

            {/* Cover Image */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Cover Image</h3>

              {trip.cover_image ? (
                <div className="space-y-4">
                  <div className="relative w-full h-64 rounded-lg overflow-hidden">
                    <Image
                      src={trip.cover_image}
                      alt={trip.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <Edit2 className="w-4 h-4 mr-1.5" />
                      Change Image
                    </button>
                    <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4 mr-1.5" />
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                  <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-sm font-medium text-gray-900 mb-1">No cover image</p>
                  <p className="text-xs text-gray-500 mb-4">Upload a beautiful cover image for your trip</p>
                  <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-rausch-500 hover:bg-rausch-600 rounded-lg transition-colors">
                    <Plus className="w-4 h-4 mr-1.5" />
                    Upload Cover Image
                  </button>
                </div>
              )}
            </div>

            {/* Photo Gallery */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">Photo Gallery</h3>
                <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-rausch-500 hover:bg-rausch-600 rounded-lg transition-colors">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Photos
                </button>
              </div>

              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-gray-500">Photo gallery coming soon</p>
              </div>
            </div>
          </div>
        )}

        {/* Other Tabs - Placeholders */}
        {['map', 'share', 'analytics'].includes(activeTab) && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="text-center py-12">
              <p className="text-sm text-gray-500 capitalize">{activeTab} content coming soon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}