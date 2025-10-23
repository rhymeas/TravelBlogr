'use client'

/**
 * Real-Time Saves Hook
 * 
 * Subscribes to Supabase Realtime for instant save/bookmark updates.
 * Updates when any user saves/unsaves a trip.
 */

import { useEffect, useCallback } from 'react'
import { getBrowserSupabase } from '@/lib/supabase'

interface UseRealtimeSavesOptions {
  tripId: string
  onSaveUpdate?: (data: { saveCount: number; action: 'save' | 'unsave'; userId: string }) => void
  enabled?: boolean
}

/**
 * Subscribe to real-time save updates
 * 
 * @example
 * ```tsx
 * useRealtimeSaves({
 *   tripId: tripId,
 *   onSaveUpdate: ({ saveCount, action, userId }) => {
 *     setSaveCount(saveCount)
 *     if (action === 'save') {
 *       toast.success('Someone saved this trip!')
 *     }
 *   }
 * })
 * ```
 */
export function useRealtimeSaves({
  tripId,
  onSaveUpdate,
  enabled = true
}: UseRealtimeSavesOptions) {
  const supabase = getBrowserSupabase()

  // Fetch updated save count
  const fetchSaveCount = useCallback(async (action: 'save' | 'unsave', userId: string) => {
    try {
      // Fetch cached count from trips table (much faster!)
      const { data, error } = await supabase
        .from('trips')
        .select('save_count')
        .eq('id', tripId)
        .single()

      if (error) return

      const saveCount = data?.save_count || 0

      if (onSaveUpdate) {
        onSaveUpdate({ saveCount, action, userId })
      }
    } catch (error) {
      // Silent fail
    }
  }, [tripId, onSaveUpdate, supabase])

  useEffect(() => {
    if (!enabled) return

    const channelName = `trip:${tripId}:saves`

    // Subscribe to save changes
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trip_saves',
          filter: `trip_id=eq.${tripId}`
        },
        (payload) => {
          fetchSaveCount('save', (payload.new as any).user_id)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'trip_saves',
          filter: `trip_id=eq.${tripId}`
        },
        (payload) => {
          fetchSaveCount('unsave', (payload.old as any).user_id)
        }
      )
      .subscribe()

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [enabled, tripId, fetchSaveCount, supabase])
}

