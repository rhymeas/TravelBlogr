'use client'

/**
 * Real-Time Likes Hook
 * 
 * Subscribes to Supabase Realtime for instant like updates.
 * Updates when any user likes/unlikes a trip.
 */

import { useEffect, useCallback } from 'react'
import { getBrowserSupabase } from '@/lib/supabase'

export type LikeEntityType = 'trip' | 'activity'

interface UseRealtimeLikesOptions {
  entityType: LikeEntityType
  entityId: string
  onLikeUpdate?: (data: { likeCount: number; action: 'like' | 'unlike'; userId: string }) => void
  enabled?: boolean
}

/**
 * Subscribe to real-time like updates
 * 
 * @example
 * ```tsx
 * useRealtimeLikes({
 *   entityType: 'trip',
 *   entityId: tripId,
 *   onLikeUpdate: ({ likeCount, action, userId }) => {
 *     setLikeCount(likeCount)
 *     if (action === 'like') {
 *       toast.success('Someone liked this trip!')
 *     }
 *   }
 * })
 * ```
 */
export function useRealtimeLikes({
  entityType,
  entityId,
  onLikeUpdate,
  enabled = true
}: UseRealtimeLikesOptions) {
  const supabase = getBrowserSupabase()

  // Get table name based on entity type
  const getTableName = useCallback(() => {
    switch (entityType) {
      case 'trip':
        return 'trip_likes'
      case 'activity':
        return 'activity_likes'
      default:
        throw new Error(`Unknown entity type: ${entityType}`)
    }
  }, [entityType])

  // Get filter column based on entity type
  const getFilterColumn = useCallback(() => {
    switch (entityType) {
      case 'trip':
        return 'trip_id'
      case 'activity':
        return 'activity_id'
      default:
        throw new Error(`Unknown entity type: ${entityType}`)
    }
  }, [entityType])

  // Fetch updated like count from cached column (much faster!)
  const fetchLikeCount = useCallback(async (action: 'like' | 'unlike', userId: string) => {
    try {
      // Get parent table name based on entity type
      const parentTable = entityType === 'trip' ? 'trips' : 'activities'

      // Fetch cached count from parent table
      const { data, error } = await supabase
        .from(parentTable)
        .select('like_count')
        .eq('id', entityId)
        .single()

      if (error) {
        console.error('Error fetching like count:', error)
        return
      }

      const likeCount = data?.like_count || 0

      if (onLikeUpdate) {
        onLikeUpdate({ likeCount, action, userId })
      }
    } catch (error) {
      console.error('Error calculating like count:', error)
    }
  }, [entityType, entityId, onLikeUpdate, supabase])

  useEffect(() => {
    if (!enabled) return

    const table = getTableName()
    const filterColumn = getFilterColumn()
    const channelName = `${entityType}:${entityId}:likes`

    // Subscribe to like changes
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table,
          filter: `${filterColumn}=eq.${entityId}`
        },
        (payload) => {
          fetchLikeCount('like', (payload.new as any).user_id)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table,
          filter: `${filterColumn}=eq.${entityId}`
        },
        (payload) => {
          fetchLikeCount('unlike', (payload.old as any).user_id)
        }
      )
      .subscribe()

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [enabled, entityType, entityId, fetchLikeCount, supabase, getTableName, getFilterColumn])
}

