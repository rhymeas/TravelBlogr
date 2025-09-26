'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { UserPlus, UserMinus, Users, Heart, MessageCircle, Share2 } from 'lucide-react'
import { createClientSupabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface User {
  id: string
  full_name: string
  username?: string
  avatar_url?: string
  bio?: string
  location?: string
  trip_count?: number
  follower_count?: number
  following_count?: number
}

interface FollowSystemProps {
  currentUserId: string
  targetUserId?: string
  showFollowButton?: boolean
  showStats?: boolean
  className?: string
}

interface FollowStats {
  followers: number
  following: number
  isFollowing: boolean
  isFollowedBy: boolean
}

export function FollowSystem({
  currentUserId,
  targetUserId,
  showFollowButton = true,
  showStats = true,
  className = ''
}: FollowSystemProps) {
  const [followStats, setFollowStats] = useState<FollowStats>({
    followers: 0,
    following: 0,
    isFollowing: false,
    isFollowedBy: false
  })
  const [loading, setLoading] = useState(false)
  const [targetUser, setTargetUser] = useState<User | null>(null)

  const supabase = createClientSupabase()

  useEffect(() => {
    if (targetUserId) {
      loadFollowStats()
      loadTargetUser()
    }
  }, [targetUserId, currentUserId])

  const loadTargetUser = async () => {
    if (!targetUserId) return

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', targetUserId)
        .single()

      if (error) throw error
      setTargetUser(data)
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }

  const loadFollowStats = async () => {
    if (!targetUserId) return

    try {
      // Get follower count
      const { count: followerCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', targetUserId)

      // Get following count
      const { count: followingCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', targetUserId)

      // Check if current user is following target user
      const { data: isFollowingData } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .single()

      // Check if target user is following current user
      const { data: isFollowedByData } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', targetUserId)
        .eq('following_id', currentUserId)
        .single()

      setFollowStats({
        followers: followerCount || 0,
        following: followingCount || 0,
        isFollowing: !!isFollowingData,
        isFollowedBy: !!isFollowedByData
      })
    } catch (error) {
      console.error('Error loading follow stats:', error)
    }
  }

  const handleFollow = async () => {
    if (!targetUserId || loading) return

    setLoading(true)
    try {
      if (followStats.isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId)

        if (error) throw error

        setFollowStats(prev => ({
          ...prev,
          isFollowing: false,
          followers: prev.followers - 1
        }))

        toast.success('Unfollowed successfully')
      } else {
        // Follow
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: currentUserId,
            following_id: targetUserId
          })

        if (error) throw error

        setFollowStats(prev => ({
          ...prev,
          isFollowing: true,
          followers: prev.followers + 1
        }))

        // Create notification for the followed user
        await supabase
          .from('notifications')
          .insert({
            user_id: targetUserId,
            type: 'follow',
            title: 'New Follower',
            message: `${targetUser?.full_name || 'Someone'} started following you`,
            data: { follower_id: currentUserId }
          })

        toast.success('Following successfully')
      }
    } catch (error) {
      console.error('Error updating follow status:', error)
      toast.error('Failed to update follow status')
    } finally {
      setLoading(false)
    }
  }

  if (!targetUserId || targetUserId === currentUserId) {
    return null
  }

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* User Info */}
      {targetUser && (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={targetUser.avatar_url} alt={targetUser.full_name} />
            <AvatarFallback>
              {targetUser.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{targetUser.full_name}</h3>
              {followStats.isFollowedBy && (
                <Badge variant="secondary" className="text-xs">
                  Follows you
                </Badge>
              )}
            </div>
            {targetUser.username && (
              <p className="text-sm text-gray-600">@{targetUser.username}</p>
            )}
          </div>
        </div>
      )}

      {/* Follow Stats */}
      {showStats && (
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span className="font-medium">{followStats.followers}</span>
            <span>followers</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">{followStats.following}</span>
            <span>following</span>
          </div>
        </div>
      )}

      {/* Follow Button */}
      {showFollowButton && (
        <Button
          onClick={handleFollow}
          disabled={loading}
          variant={followStats.isFollowing ? "outline" : "default"}
          size="sm"
          className="ml-auto"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          ) : followStats.isFollowing ? (
            <>
              <UserMinus className="h-4 w-4 mr-1" />
              Unfollow
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-1" />
              Follow
            </>
          )}
        </Button>
      )}
    </div>
  )
}

// Component for displaying follow lists
interface FollowListProps {
  userId: string
  type: 'followers' | 'following'
  currentUserId: string
  className?: string
}

export function FollowList({ userId, type, currentUserId, className = '' }: FollowListProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClientSupabase()

  useEffect(() => {
    loadFollowList()
  }, [userId, type])

  const loadFollowList = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('user_follows')
        .select(`
          *,
          ${type === 'followers' ? 'follower:users!follower_id(*)' : 'following:users!following_id(*)'}
        `)

      if (type === 'followers') {
        query = query.eq('following_id', userId)
      } else {
        query = query.eq('follower_id', userId)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      const userList = data?.map(item => 
        type === 'followers' ? item.follower : item.following
      ).filter(Boolean) || []

      setUsers(userList)
    } catch (error) {
      console.error('Error loading follow list:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg animate-pulse">
            <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-300 rounded w-32 mb-1"></div>
              <div className="h-3 bg-gray-300 rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
        <p>No {type} yet</p>
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {users.map((user) => (
        <div key={user.id} className="flex items-center justify-between p-4 bg-white border rounded-lg hover:bg-gray-50">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar_url} alt={user.full_name} />
              <AvatarFallback>
                {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium">{user.full_name}</h4>
              {user.username && (
                <p className="text-sm text-gray-600">@{user.username}</p>
              )}
              {user.bio && (
                <p className="text-sm text-gray-500 mt-1">{user.bio}</p>
              )}
            </div>
          </div>

          {user.id !== currentUserId && (
            <FollowSystem
              currentUserId={currentUserId}
              targetUserId={user.id}
              showStats={false}
              className="ml-4"
            />
          )}
        </div>
      ))}
    </div>
  )
}

// Quick follow suggestions component
interface FollowSuggestionsProps {
  currentUserId: string
  limit?: number
  className?: string
}

export function FollowSuggestions({ currentUserId, limit = 5, className = '' }: FollowSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClientSupabase()

  useEffect(() => {
    loadSuggestions()
  }, [currentUserId])

  const loadSuggestions = async () => {
    try {
      setLoading(true)

      // Get users that current user is not following
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .neq('id', currentUserId)
        .not('id', 'in', `(
          SELECT following_id FROM user_follows WHERE follower_id = '${currentUserId}'
        )`)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      setSuggestions(data || [])
    } catch (error) {
      console.error('Error loading suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg animate-pulse">
            <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
            <div className="flex-1">
              <div className="h-3 bg-gray-300 rounded w-24 mb-1"></div>
              <div className="h-2 bg-gray-300 rounded w-16"></div>
            </div>
            <div className="h-6 w-16 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (suggestions.length === 0) {
    return null
  }

  return (
    <div className={`${className}`}>
      <h3 className="font-semibold mb-3">Suggested for you</h3>
      <div className="space-y-3">
        {suggestions.map((user) => (
          <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar_url} alt={user.full_name} />
              <AvatarFallback className="text-xs">
                {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user.full_name}</p>
              {user.username && (
                <p className="text-xs text-gray-600">@{user.username}</p>
              )}
            </div>
            <FollowSystem
              currentUserId={currentUserId}
              targetUserId={user.id}
              showStats={false}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
