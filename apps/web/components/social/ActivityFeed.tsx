'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Heart, MessageCircle, Share2, MapPin, Camera, Plane, Users, Clock, AlertCircle } from 'lucide-react'
import { getBrowserSupabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import InfiniteScroll from 'react-infinite-scroll-component'
import toast from 'react-hot-toast'

interface ActivityItem {
  id: string
  type: 'trip_created' | 'post_created' | 'media_uploaded' | 'location_shared' | 'user_followed'
  user_id: string
  created_at: string
  data: any
  user?: {
    id: string
    full_name: string
    username?: string
    avatar_url?: string
  }
  isLiked?: boolean
  likeCount?: number
  commentCount?: number
}

interface ActivityFeedProps {
  userId: string
  feedType?: 'following' | 'discover' | 'personal'
  className?: string
  realTimeUpdates?: boolean
}

export function ActivityFeed({
  userId,
  feedType = 'following',
  className = '',
  realTimeUpdates = true
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  // Use refs to avoid stale closures
  const isMounted = useRef(true)
  const loadingRef = useRef(false)
  const subscriptionRef = useRef<any>(null)
  
  const supabase = getBrowserSupabase()

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
      }
    }
  }, [])

  // Set up real-time subscription
  useEffect(() => {
    if (!realTimeUpdates) return

    // Subscribe to new activities
    const channel = supabase
      .channel(`activity-feed-${userId}-${feedType}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_feed'
        },
        async (payload) => {
          if (!isMounted.current) return
          
          // Fetch the full activity with user data
          const { data: newActivity } = await supabase
            .from('activity_feed')
            .select(`
              *,
              user:users!user_id(id, full_name, username, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single()

          if (newActivity) {
            // Check if this activity should be shown based on feed type
            if (shouldShowActivity(newActivity, feedType, userId)) {
              setActivities(prev => [newActivity, ...prev])
              toast.success('New activity in your feed!', {
                icon: '✨',
                duration: 3000
              })
            }
          }
        }
      )
      .subscribe()

    subscriptionRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [feedType, userId, realTimeUpdates])

  // Load activities when feed type or user changes
  useEffect(() => {
    loadActivities(true)
  }, [feedType, userId])

  const shouldShowActivity = (activity: ActivityItem, type: string, currentUserId: string) => {
    if (type === 'personal') {
      return activity.user_id === currentUserId
    }
    if (type === 'following') {
      // This would need to check if the activity user is followed
      // For now, return true as we'll filter server-side
      return true
    }
    return true // 'discover' shows all
  }

  const loadActivities = useCallback(async (reset = false) => {
    // Prevent concurrent loads
    if (loadingRef.current && !reset) return
    loadingRef.current = true

    try {
      if (reset) {
        setLoading(true)
        setPage(0)
        setActivities([])
        setError(null)
        setHasMore(true)
      }

      const currentPage = reset ? 0 : page
      const limit = 20
      const offset = currentPage * limit

      let query = supabase
        .from('activity_feed')
        .select(`
          *,
          user:profiles!user_id(id, full_name, username, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      // Filter based on feed type
      if (feedType === 'following') {
        // Get activities from users that current user follows
        const { data: followingIds, error: followError } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', userId)

        if (followError) throw followError

        const followingUserIds = followingIds?.map(f => f.following_id) || []
        
        if (followingUserIds.length === 0) {
          // If not following anyone, show empty state
          if (isMounted.current) {
            setActivities([])
            setHasMore(false)
            setLoading(false)
          }
          return
        }
        
        // Include own activities in following feed
        followingUserIds.push(userId)
        query = query.in('user_id', followingUserIds)
      } else if (feedType === 'personal') {
        query = query.eq('user_id', userId)
      }
      // 'discover' shows all activities (no additional filter)

      const { data, error } = await query

      if (error) throw error

      // Check if user has liked each activity
      const activityIds = data?.map(a => a.id) || []
      let likedActivities: string[] = []
      
      if (activityIds.length > 0) {
        const { data: likes } = await supabase
          .from('activity_likes')
          .select('activity_id')
          .in('activity_id', activityIds)
          .eq('user_id', userId)
        
        likedActivities = likes?.map(l => l.activity_id) || []
      }

      // Get like and comment counts
      const enrichedActivities = await Promise.all(
        (data || []).map(async (activity) => {
          const [{ count: likeCount }, { count: commentCount }] = await Promise.all([
            supabase
              .from('activity_likes')
              .select('*', { count: 'exact', head: true })
              .eq('activity_id', activity.id),
            supabase
              .from('activity_comments')
              .select('*', { count: 'exact', head: true })
              .eq('activity_id', activity.id)
          ])

          return {
            ...activity,
            isLiked: likedActivities.includes(activity.id),
            likeCount: likeCount || 0,
            commentCount: commentCount || 0
          }
        })
      )

      if (!isMounted.current) return

      if (reset) {
        setActivities(enrichedActivities)
      } else {
        setActivities(prev => [...prev, ...enrichedActivities])
      }

      setHasMore(enrichedActivities.length === limit)
      setPage(currentPage + 1)
    } catch (error) {
      console.error('Error loading activities:', error)
      if (isMounted.current) {
        setError('Failed to load activities. Please try again.')
        toast.error('Failed to load activities')
      }
    } finally {
      if (isMounted.current) {
        setLoading(false)
        loadingRef.current = false
      }
    }
  }, [feedType, userId, page, supabase])

  const handleLike = useCallback(async (activityId: string) => {
    // Find the activity
    const activity = activities.find(a => a.id === activityId)
    if (!activity) return

    // Optimistic update
    setActivities(prev => prev.map(a => 
      a.id === activityId 
        ? { 
            ...a, 
            isLiked: !a.isLiked,
            likeCount: a.isLiked ? (a.likeCount || 1) - 1 : (a.likeCount || 0) + 1
          }
        : a
    ))

    try {
      if (activity.isLiked) {
        // Unlike
        const { error } = await supabase
          .from('activity_likes')
          .delete()
          .eq('activity_id', activityId)
          .eq('user_id', userId)
        
        if (error) throw error
      } else {
        // Like
        const { error } = await supabase
          .from('activity_likes')
          .insert({
            activity_id: activityId,
            user_id: userId
          })
        
        if (error) throw error
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      
      // Revert optimistic update
      setActivities(prev => prev.map(a => 
        a.id === activityId 
          ? { 
              ...a, 
              isLiked: activity.isLiked,
              likeCount: activity.likeCount
            }
          : a
      ))
      
      toast.error('Failed to update like')
    }
  }, [activities, userId, supabase])

  const handleShare = useCallback(async (activity: ActivityItem) => {
    const shareUrl = `${window.location.origin}/activity/${activity.id}`
    const shareText = getActivityTitle(activity)

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this travel activity',
          text: shareText,
          url: shareUrl
        })
      } catch (err) {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied to clipboard!')
    }
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'trip_created':
        return <Plane className="h-5 w-5 text-blue-600" />
      case 'post_created':
        return <MessageCircle className="h-5 w-5 text-green-600" />
      case 'media_uploaded':
        return <Camera className="h-5 w-5 text-purple-600" />
      case 'location_shared':
        return <MapPin className="h-5 w-5 text-red-600" />
      case 'user_followed':
        return <Users className="h-5 w-5 text-orange-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getActivityTitle = (activity: ActivityItem) => {
    const userName = activity.user?.full_name || 'Someone'
    
    switch (activity.type) {
      case 'trip_created':
        return `${userName} created a new trip`
      case 'post_created':
        return `${userName} shared a travel story`
      case 'media_uploaded':
        return `${userName} uploaded ${activity.data.media_count || 1} photo${activity.data.media_count > 1 ? 's' : ''}`
      case 'location_shared':
        return `${userName} shared their location`
      case 'user_followed':
        return `${userName} started following ${activity.data.followed_user_name || 'someone'}`
      default:
        return `${userName} had an activity`
    }
  }

  const getActivityDescription = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'trip_created':
        return activity.data.trip_title || 'New adventure begins!'
      case 'post_created':
        return activity.data.post_content?.substring(0, 150) + (activity.data.post_content?.length > 150 ? '...' : '') || ''
      case 'media_uploaded':
        return `From ${activity.data.trip_title || 'their trip'}`
      case 'location_shared':
        return activity.data.location_name || `${activity.data.latitude?.toFixed(4)}, ${activity.data.longitude?.toFixed(4)}`
      case 'user_followed':
        return 'Expanding their travel network'
      default:
        return ''
    }
  }

  const renderActivityContent = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'trip_created':
        return (
          <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Plane className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">{activity.data.trip_title}</span>
            </div>
            {activity.data.trip_description && (
              <p className="text-sm text-blue-700 line-clamp-2">{activity.data.trip_description}</p>
            )}
            {activity.data.destination && (
              <div className="flex items-center gap-1 mt-2 text-sm text-blue-600">
                <MapPin className="h-3 w-3" />
                <span>{activity.data.destination}</span>
              </div>
            )}
          </div>
        )

      case 'media_uploaded':
        return (
          <div className="mt-3">
            {activity.data.media_urls && activity.data.media_urls.length > 0 && (
              <div className={`grid gap-2 ${
                activity.data.media_urls.length === 1 ? 'grid-cols-1' :
                activity.data.media_urls.length === 2 ? 'grid-cols-2' :
                'grid-cols-2 sm:grid-cols-3'
              }`}>
                {activity.data.media_urls.slice(0, 6).map((url: string, index: number) => (
                  <div 
                    key={index} 
                    className={`relative bg-gray-200 rounded-lg overflow-hidden ${
                      activity.data.media_urls.length === 1 ? 'aspect-video' : 'aspect-square'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Media ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-image.png'
                      }}
                    />
                    {index === 5 && activity.data.media_urls.length > 6 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-medium text-lg">
                          +{activity.data.media_urls.length - 6}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case 'location_shared':
        return (
          <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-800 font-medium">
                {activity.data.location_name || 'Current location'}
              </span>
            </div>
            {activity.data.latitude && activity.data.longitude && (
              <p className="text-xs text-red-600 mt-1">
                {activity.data.latitude.toFixed(6)}, {activity.data.longitude.toFixed(6)}
              </p>
            )}
            {activity.data.location_description && (
              <p className="text-sm text-red-700 mt-2">
                {activity.data.location_description}
              </p>
            )}
          </div>
        )

      default:
        return null
    }
  }

  // Loading state
  if (loading && activities.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border rounded-lg p-4 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-48 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-32 mb-3"></div>
                <div className="h-20 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Error state
  if (error && activities.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load activities</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => loadActivities(true)}>
          Try Again
        </Button>
      </div>
    )
  }

  // Empty state
  if (activities.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-6xl mb-4">🌍</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {feedType === 'following' ? 'No activities from people you follow' : 'No activities yet'}
        </h3>
        <p className="text-gray-600">
          {feedType === 'following' 
            ? 'Follow some travelers to see their adventures here'
            : 'Start exploring and sharing your travel experiences'
          }
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      <InfiniteScroll
        dataLength={activities.length}
        next={() => loadActivities(false)}
        hasMore={hasMore}
        loader={
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        }
        endMessage={
          <div className="text-center py-8 text-gray-500">
            <p>You've reached the end of the feed</p>
          </div>
        }
      >
        <div className="space-y-4">
          {activities.map((activity) => (
            <div 
              key={activity.id} 
              className="bg-white border rounded-lg p-4 hover:shadow-md transition-all duration-200"
            >
              {/* Activity Header */}
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-white">
                  <AvatarImage 
                    src={activity.user?.avatar_url} 
                    alt={activity.user?.full_name} 
                  />
                  <AvatarFallback>
                    {activity.user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getActivityIcon(activity.type)}
                    <h3 className="font-medium text-gray-900 truncate">
                      {getActivityTitle(activity)}
                    </h3>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {getActivityDescription(activity)}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}</span>
                    {activity.data.trip_title && (
                      <Badge variant="outline" className="text-xs">
                        {activity.data.trip_title}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Activity Content */}
              {renderActivityContent(activity)}

              {/* Activity Actions */}
              <div className="flex items-center gap-1 mt-4 pt-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(activity.id)}
                  className={`flex items-center gap-1.5 hover:bg-red-50 ${
                    activity.isLiked ? 'text-red-600' : 'text-gray-600'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${activity.isLiked ? 'fill-current' : ''}`} />
                  <span>{activity.likeCount || 0}</span>
                </Button>

                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center gap-1.5 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{activity.commentCount || 0}</span>
                </Button>

                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleShare(activity)}
                  className="flex items-center gap-1.5 text-gray-600 hover:bg-green-50 hover:text-green-600 ml-auto"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </InfiniteScroll>
    </div>
  )
}
