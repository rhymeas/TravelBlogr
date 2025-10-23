'use client'

import { useState, useEffect } from 'react'
import { Bell, Users, MapPin, Camera, MessageCircle, Heart } from 'lucide-react'
import { createClientSupabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

interface LiveTripUpdatesProps {
  tripId: string
  userId: string
}

interface LiveUpdate {
  id: string
  type: 'post' | 'location' | 'photo' | 'comment' | 'like'
  title: string
  content?: string
  user: {
    id: string
    name: string
    avatar?: string
  }
  timestamp: string
  data?: any
}

export function LiveTripUpdates({ tripId, userId }: LiveTripUpdatesProps) {
  const [updates, setUpdates] = useState<LiveUpdate[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])
  const [notifications, setNotifications] = useState(true)

  const supabase = createClientSupabase()

  useEffect(() => {
    // Subscribe to real-time updates for this trip
    const channel = supabase
      .channel(`trip:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: `trip_id=eq.${tripId}`
        },
        (payload) => {
          handleNewPost(payload.new)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_locations',
          filter: `trip_id=eq.${tripId}`
        },
        (payload) => {
          handleLocationUpdate(payload.new)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'media',
          filter: `trip_id=eq.${tripId}`
        },
        (payload) => {
          handleNewMedia(payload.new)
        }
      )
      .on('broadcast', { event: 'user_presence' }, (payload) => {
        handlePresenceUpdate(payload)
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        handleTypingUpdate(payload)
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
        if (status === 'SUBSCRIBED') {
          // Send presence update
          channel.send({
            type: 'broadcast',
            event: 'user_presence',
            payload: {
              user_id: userId,
              status: 'online',
              timestamp: new Date().toISOString()
            }
          })
        }
      })

    // Load initial updates
    loadRecentUpdates()

    return () => {
      // Send offline status
      channel.send({
        type: 'broadcast',
        event: 'user_presence',
        payload: {
          user_id: userId,
          status: 'offline',
          timestamp: new Date().toISOString()
        }
      })
      
      supabase.removeChannel(channel)
    }
  }, [tripId, userId])

  const loadRecentUpdates = async () => {
    try {
      // Get recent posts with profiles (not users)
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (postsError) {
        console.error('Error loading posts:', postsError)
      }

      // Get recent media with profiles
      const { data: media, error: mediaError } = await supabase
        .from('media')
        .select(`
          *,
          profiles!user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (mediaError) {
        console.error('Error loading media:', mediaError)
      }

      // Combine and sort updates
      const allUpdates: LiveUpdate[] = [
        ...(posts || []).map(post => ({
          id: post.id,
          type: 'post' as const,
          title: post.title || 'New post',
          content: post.content,
          user: {
            id: post.users.id,
            name: post.users.full_name || 'Anonymous',
            avatar: post.users.avatar_url
          },
          timestamp: post.created_at,
          data: post
        })),
        ...(media || []).map(item => ({
          id: item.id,
          type: 'photo' as const,
          title: 'New photo uploaded',
          content: item.caption,
          user: {
            id: item.users.id,
            name: item.users.full_name || 'Anonymous',
            avatar: item.users.avatar_url
          },
          timestamp: item.created_at,
          data: item
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setUpdates(allUpdates)
    } catch (error) {
      console.error('Error loading updates:', error)
    }
  }

  const handleNewPost = async (post: any) => {
    // Get user info
    const { data: user } = await supabase
      .from('users')
      .select('id, full_name, avatar_url')
      .eq('id', post.user_id)
      .single()

    const update: LiveUpdate = {
      id: post.id,
      type: 'post',
      title: post.title || 'New post',
      content: post.content,
      user: {
        id: user?.id || post.user_id,
        name: user?.full_name || 'Anonymous',
        avatar: user?.avatar_url
      },
      timestamp: post.created_at,
      data: post
    }

    setUpdates(prev => [update, ...prev.slice(0, 49)]) // Keep last 50 updates

    if (notifications && post.user_id !== userId) {
      toast.success(`${update.user.name} added a new post: ${update.title}`)
    }
  }

  const handleLocationUpdate = async (location: any) => {
    // Get user info
    const { data: user } = await supabase
      .from('users')
      .select('id, full_name, avatar_url')
      .eq('id', location.user_id)
      .single()

    const update: LiveUpdate = {
      id: location.id,
      type: 'location',
      title: 'Location updated',
      user: {
        id: user?.id || location.user_id,
        name: user?.full_name || 'Anonymous',
        avatar: user?.avatar_url
      },
      timestamp: location.timestamp,
      data: location
    }

    setUpdates(prev => [update, ...prev.slice(0, 49)])

    if (notifications && location.user_id !== userId) {
      toast.success(`${update.user.name} shared their location`)
    }
  }

  const handleNewMedia = async (media: any) => {
    // Get user info
    const { data: user } = await supabase
      .from('users')
      .select('id, full_name, avatar_url')
      .eq('id', media.user_id)
      .single()

    const update: LiveUpdate = {
      id: media.id,
      type: 'photo',
      title: 'New photo uploaded',
      content: media.caption,
      user: {
        id: user?.id || media.user_id,
        name: user?.full_name || 'Anonymous',
        avatar: user?.avatar_url
      },
      timestamp: media.created_at,
      data: media
    }

    setUpdates(prev => [update, ...prev.slice(0, 49)])

    if (notifications && media.user_id !== userId) {
      toast.success(`${update.user.name} uploaded a new photo`)
    }
  }

  const handlePresenceUpdate = (payload: any) => {
    const { user_id, status, timestamp } = payload.payload

    setOnlineUsers(prev => {
      const filtered = prev.filter(u => u.user_id !== user_id)
      if (status === 'online') {
        return [...filtered, { user_id, status, timestamp }]
      }
      return filtered
    })
  }

  const handleTypingUpdate = (payload: any) => {
    // Handle typing indicators
    console.log('User typing:', payload)
  }

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'post':
        return <MessageCircle className="h-4 w-4 text-blue-600" />
      case 'location':
        return <MapPin className="h-4 w-4 text-green-600" />
      case 'photo':
        return <Camera className="h-4 w-4 text-purple-600" />
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-orange-600" />
      case 'like':
        return <Heart className="h-4 w-4 text-red-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Live Updates</h3>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Online users */}
            {onlineUsers.length > 0 && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">{onlineUsers.length}</span>
              </div>
            )}
            
            {/* Notifications toggle */}
            <button
              onClick={() => setNotifications(!notifications)}
              className={`p-1 rounded ${notifications ? 'text-blue-600' : 'text-gray-400'}`}
            >
              <Bell className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Updates List */}
      <div className="max-h-96 overflow-y-auto">
        {updates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>No updates yet</p>
            <p className="text-sm mt-1">Activity will appear here in real-time</p>
          </div>
        ) : (
          <div className="divide-y">
            {updates.map((update) => (
              <div key={update.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-3">
                  {/* User Avatar */}
                  <div className="flex-shrink-0">
                    {update.user.avatar ? (
                      <img
                        src={update.user.avatar}
                        alt={update.user.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          {update.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Update Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getUpdateIcon(update.type)}
                      <span className="font-medium text-sm">{update.user.name}</span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(update.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-900 mb-1">{update.title}</p>
                    
                    {update.content && (
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {update.content}
                      </p>
                    )}

                    {/* Media preview */}
                    {update.type === 'photo' && update.data?.url && (
                      <div className="mt-2">
                        <img
                          src={update.data.thumbnail_url || update.data.url}
                          alt="Update"
                          className="w-16 h-16 object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="p-3 bg-yellow-50 border-t border-yellow-200">
          <div className="flex items-center gap-2 text-yellow-800">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-sm">Reconnecting...</span>
          </div>
        </div>
      )}
    </div>
  )
}
