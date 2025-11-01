'use client'

import { useState, useEffect } from 'react'
import { getBrowserSupabase } from '@/lib/supabase'
import { FeedPost } from './FeedPost'
import { Loader2, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

interface FeedActivity {
  id: string
  user_id: string
  type: string
  data: any
  created_at: string
  profiles?: {
    id: string
    full_name: string
    username: string
    avatar_url: string
  }
}

interface RealTimeFeedProps {
  onLike: (postId: string) => void
  onBookmark: (postId: string) => void
  onComment: (postId: string) => void
}

export function RealTimeFeed({ onLike, onBookmark, onComment }: RealTimeFeedProps) {
  const [activities, setActivities] = useState<FeedActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [newActivityCount, setNewActivityCount] = useState(0)

  useEffect(() => {
    const supabase = getBrowserSupabase()

    // Initial load
    const loadActivities = async () => {
      try {
        const { data, error } = await supabase
          .from('activity_feed')
          .select(`
            *,
            profiles!user_id (
              id,
              full_name,
              username,
              avatar_url
            )
          `)
          .order('created_at', { ascending: false })
          .limit(20)

        if (error) throw error
        setActivities(data || [])
      } catch (error) {
        console.error('Error loading activities:', error)
        toast.error('Failed to load feed')
      } finally {
        setLoading(false)
      }
    }

    loadActivities()

    // Real-time subscription
    const channel = supabase
      .channel('activity_feed_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_feed'
        },
        async (payload) => {
          // Fetch the new activity with user profile
          const { data: newActivity, error } = await supabase
            .from('activity_feed')
            .select(`
              *,
              profiles!user_id (
                id,
                full_name,
                username,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single()

          if (!error && newActivity) {
            setActivities(prev => [newActivity, ...prev])
            setNewActivityCount(prev => prev + 1)
            
            // Show toast notification
            toast.success('New post added to feed!', {
              icon: '✨',
              duration: 3000
            })

            // Reset new count after 5 seconds
            setTimeout(() => setNewActivityCount(0), 5000)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-rausch-500" />
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {/* New Activity Indicator */}
      {newActivityCount > 0 && (
        <div className="sticky top-0 z-10 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 text-center text-sm font-medium animate-in slide-in-from-top duration-300">
          <Zap className="inline h-4 w-4 mr-2" />
          {newActivityCount} new {newActivityCount === 1 ? 'post' : 'posts'} added!
        </div>
      )}

      {/* Feed Posts */}
      {activities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No posts yet. Be the first to share!</p>
        </div>
      ) : (
        activities.map((activity) => {
          // Transform activity to FeedPost format
          const post = {
            id: activity.id,
            user: {
              username: activity.profiles?.username || 'user',
              name: activity.profiles?.full_name || 'Anonymous',
              avatar: activity.profiles?.avatar_url || '/default-avatar.png',
              verified: false
            },
            location: activity.data?.location || '',
            locationSlug: activity.data?.location_id ? `/locations/${activity.data.location_id}` : undefined,
            media: {
              type: activity.data?.images?.length > 1 ? 'carousel' : 'image',
              items: activity.data?.images?.map((url: string) => ({
                url,
                type: activity.type === 'video_upload' ? 'video' : 'image'
              })) || (activity.data?.image_url ? [{
                url: activity.data.image_url,
                type: activity.type === 'video_upload' ? 'video' : 'image'
              }] : [])
            },
            caption: activity.data?.caption || '',
            likes: 0,
            comments: 0,
            timeAgo: new Date(activity.created_at).toLocaleString(),
            isLiked: false,
            isBookmarked: false
          }

          return (
            <FeedPost
              key={activity.id}
              post={post as any}
              onLike={onLike}
              onBookmark={onBookmark}
              onComment={onComment}
              showFollowButton={false}
            />
          )
        })
      )}
    </div>
  )
}

