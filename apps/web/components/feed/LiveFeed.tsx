'use client'

import { useState, useEffect, useRef } from 'react'
import { useSupabase } from '@/lib/supabase'
import { FeedItem } from './FeedItem'
import { FeedSkeleton } from './FeedSkeleton'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  RefreshCw, Zap, TrendingUp, Users, 
  Globe, Clock, Activity 
} from 'lucide-react'

interface FeedActivity {
  id: string
  user_id: string
  type: string
  data: any
  created_at: string
  user: {
    id: string
    name: string
    username: string
    avatar_url: string
  }
}

interface LiveFeedProps {
  feedType: 'all' | 'following' | 'trending' | 'live'
  userId?: string
  showRealTime?: boolean
  refreshInterval?: number
}

export function LiveFeed({ 
  feedType, 
  userId, 
  showRealTime = true, 
  refreshInterval = 10000 
}: LiveFeedProps) {
  const [activities, setActivities] = useState<FeedActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [newActivityCount, setNewActivityCount] = useState(0)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const supabase = useSupabase()
  const intervalRef = useRef<NodeJS.Timeout>()

  // Fetch activities based on feed type
  const fetchActivities = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      let query = supabase
        .from('activity_feed')
        .select(`
          *,
          user:users (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      // Apply filters based on feed type
      switch (feedType) {
        case 'following':
          if (userId) {
            // Get activities from users the current user follows
            const { data: following } = await supabase
              .from('user_follows')
              .select('following_id')
              .eq('follower_id', userId)

            const followingIds = following?.map(f => f.following_id) || []
            if (followingIds.length > 0) {
              query = query.in('user_id', followingIds)
            } else {
              // If not following anyone, return empty
              setActivities([])
              setLoading(false)
              setRefreshing(false)
              return
            }
          }
          break

        case 'trending':
          // Get activities with high engagement in the last 24 hours
          const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          query = query.gte('created_at', yesterday)
          break

        case 'live':
          // Get very recent activities (last hour)
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
          query = query.gte('created_at', oneHourAgo)
          break

        case 'all':
        default:
          // No additional filters for 'all'
          break
      }

      const { data, error } = await query

      if (error) throw error

      if (isRefresh) {
        // Count new activities since last refresh
        const newActivities = data?.filter(
          activity => new Date(activity.created_at) > lastRefresh
        ) || []
        setNewActivityCount(newActivities.length)
        setLastRefresh(new Date())
      }

      setActivities(data || [])
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Set up real-time subscription
  useEffect(() => {
    if (!showRealTime) return

    const channel = supabase
      .channel('live-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_feed'
        },
        (payload) => {
          // Add new activity to the top of the feed
          const newActivity = payload.new as FeedActivity
          setActivities(prev => [newActivity, ...prev])
          setNewActivityCount(prev => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, showRealTime])

  // Set up auto-refresh interval
  useEffect(() => {
    if (!showRealTime || !refreshInterval) return

    intervalRef.current = setInterval(() => {
      fetchActivities(true)
    }, refreshInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [showRealTime, refreshInterval])

  // Initial fetch
  useEffect(() => {
    fetchActivities()
  }, [feedType, userId])

  const handleRefresh = () => {
    fetchActivities(true)
    setNewActivityCount(0)
  }

  const getFeedIcon = () => {
    switch (feedType) {
      case 'following':
        return <Users className="h-4 w-4" />
      case 'trending':
        return <TrendingUp className="h-4 w-4" />
      case 'live':
        return <Zap className="h-4 w-4" />
      default:
        return <Globe className="h-4 w-4" />
    }
  }

  const getFeedTitle = () => {
    switch (feedType) {
      case 'following':
        return 'Following'
      case 'trending':
        return 'Trending'
      case 'live':
        return 'Live Now'
      default:
        return 'All Activity'
    }
  }

  if (loading) {
    return <FeedSkeleton />
  }

  return (
    <div className="space-y-4">
      {/* Feed Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getFeedIcon()}
          <h2 className="text-lg font-semibold text-gray-900">
            {getFeedTitle()}
          </h2>
          {showRealTime && (
            <Badge variant="secondary" className="animate-pulse">
              <Activity className="h-3 w-3 mr-1" />
              Live
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {newActivityCount > 0 && (
            <Badge variant="default" className="bg-blue-600">
              {newActivityCount} new
            </Badge>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Last Updated */}
      {showRealTime && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
        </div>
      )}

      {/* Feed Items */}
      {activities.length === 0 ? (
        <div className="text-center py-12">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No activity yet
          </h3>
          <p className="text-gray-600">
            {feedType === 'following' 
              ? "Follow some users to see their activity here."
              : "Be the first to share something!"
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <FeedItem 
              key={activity.id} 
              activity={activity}
              isNew={index < newActivityCount}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {activities.length >= 50 && (
        <div className="text-center pt-6">
          <Button variant="outline" onClick={() => fetchActivities()}>
            Load More Activities
          </Button>
        </div>
      )}
    </div>
  )
}
