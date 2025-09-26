'use client'

import { useState, useEffect, useCallback } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Heart, MessageCircle, Share2, MapPin, Camera, Plane, Users, Clock } from 'lucide-react'
import { createClientSupabase } from '@/lib/supabase'
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
}

interface ActivityFeedProps {
  userId: string
  feedType?: 'following' | 'discover' | 'personal'
  className?: string
}

export function ActivityFeed({
  userId,
  feedType = 'following',
  className = ''
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)

  const supabase = createClientSupabase()

  useEffect(() => {
    loadActivities(true)
  }, [feedType, userId])

  const loadActivities = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setPage(0)
        setActivities([])
      }

      const currentPage = reset ? 0 : page
      const limit = 20
      const offset = currentPage * limit

      let query = supabase
        .from('activity_feed')
        .select(`
          *,
          user:users!user_id(id, full_name, username, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      // Filter based on feed type
      if (feedType === 'following') {
        // Get activities from users that current user follows
        const { data: followingIds } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', userId)

        const followingUserIds = followingIds?.map(f => f.following_id) || []
        if (followingUserIds.length > 0) {
          query = query.in('user_id', followingUserIds)
        } else {
          // If not following anyone, show empty feed
          setActivities([])
          setHasMore(false)
          setLoading(false)
          return
        }
      } else if (feedType === 'personal') {
        query = query.eq('user_id', userId)
      }
      // 'discover' shows all activities (no additional filter)

      const { data, error } = await query

      if (error) throw error

      const newActivities = data || []
      
      if (reset) {
        setActivities(newActivities)
      } else {
        setActivities(prev => [...prev, ...newActivities])
      }

      setHasMore(newActivities.length === limit)
      setPage(currentPage + 1)
    } catch (error) {
      console.error('Error loading activities:', error)
      toast.error('Failed to load activities')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (activityId: string) => {
    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('activity_likes')
        .select('id')
        .eq('activity_id', activityId)
        .eq('user_id', userId)
        .single()

      if (existingLike) {
        // Unlike
        await supabase
          .from('activity_likes')
          .delete()
          .eq('id', existingLike.id)

        setActivities(prev => prev.map(activity => 
          activity.id === activityId 
            ? { ...activity, data: { ...activity.data, likes: (activity.data.likes || 1) - 1, isLiked: false } }
            : activity
        ))
      } else {
        // Like
        await supabase
          .from('activity_likes')
          .insert({
            activity_id: activityId,
            user_id: userId
          })

        setActivities(prev => prev.map(activity => 
          activity.id === activityId 
            ? { ...activity, data: { ...activity.data, likes: (activity.data.likes || 0) + 1, isLiked: true } }
            : activity
        ))
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      toast.error('Failed to update like')
    }
  }

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
        return `${userName} started following ${activity.data.followed_user_name}`
      default:
        return `${userName} had an activity`
    }
  }

  const getActivityDescription = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'trip_created':
        return activity.data.trip_title || 'New adventure begins!'
      case 'post_created':
        return activity.data.post_content?.substring(0, 150) + (activity.data.post_content?.length > 150 ? '...' : '')
      case 'media_uploaded':
        return `From ${activity.data.trip_title || 'their trip'}`
      case 'location_shared':
        return activity.data.location_name || `${activity.data.latitude}, ${activity.data.longitude}`
      case 'user_followed':
        return 'New connection made'
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
              <p className="text-sm text-blue-700">{activity.data.trip_description}</p>
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
              <div className="grid grid-cols-2 gap-2">
                {activity.data.media_urls.slice(0, 4).map((url: string, index: number) => (
                  <div key={index} className="relative aspect-square bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={url}
                      alt={`Media ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {index === 3 && activity.data.media_urls.length > 4 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-medium">
                          +{activity.data.media_urls.length - 4}
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
              <span className="text-sm text-red-800">
                {activity.data.location_name || 'Current location'}
              </span>
            </div>
            {activity.data.latitude && activity.data.longitude && (
              <p className="text-xs text-red-600 mt-1">
                {activity.data.latitude.toFixed(6)}, {activity.data.longitude.toFixed(6)}
              </p>
            )}
          </div>
        )

      default:
        return null
    }
  }

  if (loading && activities.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(5)].map((_, i) => (
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
            <div key={activity.id} className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow">
              {/* Activity Header */}
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={activity.user?.avatar_url} alt={activity.user?.full_name} />
                  <AvatarFallback>
                    {activity.user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getActivityIcon(activity.type)}
                    <h3 className="font-medium text-gray-900">
                      {getActivityTitle(activity)}
                    </h3>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
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
              <div className="flex items-center gap-4 mt-4 pt-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(activity.id)}
                  className={`flex items-center gap-1 ${activity.data.isLiked ? 'text-red-600' : 'text-gray-600'}`}
                >
                  <Heart className={`h-4 w-4 ${activity.data.isLiked ? 'fill-current' : ''}`} />
                  <span>{activity.data.likes || 0}</span>
                </Button>

                <Button variant="ghost" size="sm" className="flex items-center gap-1 text-gray-600">
                  <MessageCircle className="h-4 w-4" />
                  <span>{activity.data.comments || 0}</span>
                </Button>

                <Button variant="ghost" size="sm" className="flex items-center gap-1 text-gray-600">
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
