'use client'

/**
 * Real-Time Comments Hook
 * 
 * Subscribes to Supabase Realtime for instant comment updates.
 * Works with all comment types: trips, locations, posts, blog posts.
 */

import { useEffect, useCallback } from 'react'
import { getBrowserSupabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export type CommentType = 'trip' | 'location' | 'post' | 'blog'

interface UseRealtimeCommentsOptions {
  type: CommentType
  entityId: string
  onCommentAdded?: (comment: any) => void
  onCommentUpdated?: (comment: any) => void
  onCommentDeleted?: (commentId: string) => void
  showToasts?: boolean
}

/**
 * Subscribe to real-time comment updates
 * 
 * @example
 * ```tsx
 * useRealtimeComments({
 *   type: 'trip',
 *   entityId: tripId,
 *   onCommentAdded: (comment) => {
 *     setComments(prev => [comment, ...prev])
 *   },
 *   showToasts: true
 * })
 * ```
 */
export function useRealtimeComments({
  type,
  entityId,
  onCommentAdded,
  onCommentUpdated,
  onCommentDeleted,
  showToasts = true
}: UseRealtimeCommentsOptions) {
  const supabase = getBrowserSupabase()

  // Get table name and filter column based on comment type
  const getTableConfig = useCallback(() => {
    switch (type) {
      case 'trip':
        return { table: 'comments', filterColumn: 'trip_id' }
      case 'post':
        return { table: 'comments', filterColumn: 'post_id' }
      case 'location':
        return { table: 'location_comments', filterColumn: 'location_id' }
      case 'blog':
        return { table: 'cms_comments', filterColumn: 'post_id' }
      default:
        throw new Error(`Unknown comment type: ${type}`)
    }
  }, [type])

  useEffect(() => {
    const { table, filterColumn } = getTableConfig()
    const channelName = `${type}:${entityId}:comments`

    // Subscribe to comment changes
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
          console.log('New comment received:', payload.new)
          
          if (onCommentAdded) {
            onCommentAdded(payload.new)
          }
          
          if (showToasts) {
            toast.success('New comment added!', {
              icon: '💬',
              duration: 3000
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table,
          filter: `${filterColumn}=eq.${entityId}`
        },
        (payload) => {
          console.log('Comment updated:', payload.new)
          
          if (onCommentUpdated) {
            onCommentUpdated(payload.new)
          }
          
          if (showToasts) {
            toast.success('Comment updated!', {
              icon: '✏️',
              duration: 2000
            })
          }
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
          console.log('Comment deleted:', payload.old)
          
          if (onCommentDeleted) {
            onCommentDeleted(payload.old.id)
          }
          
          if (showToasts) {
            toast.success('Comment deleted!', {
              icon: '🗑️',
              duration: 2000
            })
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Subscribed to ${channelName}`)
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Error subscribing to ${channelName}`)
        }
      })

    // Cleanup on unmount
    return () => {
      console.log(`🔌 Unsubscribing from ${channelName}`)
      supabase.removeChannel(channel)
    }
  }, [type, entityId, onCommentAdded, onCommentUpdated, onCommentDeleted, showToasts, supabase, getTableConfig])
}

