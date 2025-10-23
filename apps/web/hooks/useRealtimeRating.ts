'use client'

/**
 * Real-Time Rating Hook
 * 
 * Subscribes to Supabase Realtime for instant rating updates.
 * Updates when any user rates a location.
 */

import { useEffect, useCallback } from 'react'
import { getBrowserSupabase } from '@/lib/supabase'

interface UseRealtimeRatingOptions {
  locationId: string
  locationSlug: string
  onRatingUpdate?: (data: { averageRating: number; ratingCount: number }) => void
  enabled?: boolean
}

/**
 * Subscribe to real-time rating updates
 * 
 * @example
 * ```tsx
 * useRealtimeRating({
 *   locationId: location.id,
 *   locationSlug: location.slug,
 *   onRatingUpdate: ({ averageRating, ratingCount }) => {
 *     setRating(averageRating)
 *     setRatingCount(ratingCount)
 *   }
 * })
 * ```
 */
export function useRealtimeRating({
  locationId,
  locationSlug,
  onRatingUpdate,
  enabled = true
}: UseRealtimeRatingOptions) {
  const supabase = getBrowserSupabase()

  // Fetch updated rating stats from cached columns (much faster!)
  const fetchRatingStats = useCallback(async () => {
    try {
      // Fetch cached stats from locations table
      const { data, error } = await supabase
        .from('locations')
        .select('average_rating, rating_count')
        .eq('id', locationId)
        .single()

      if (error) {
        console.error('Error fetching rating stats:', error)
        return
      }

      const averageRating = data?.average_rating || 0
      const ratingCount = data?.rating_count || 0

      if (onRatingUpdate) {
        onRatingUpdate({
          averageRating: Number(averageRating),
          ratingCount
        })
      }
    } catch (error) {
      console.error('Error calculating rating stats:', error)
    }
  }, [locationId, locationSlug, onRatingUpdate, supabase])

  useEffect(() => {
    if (!enabled) return

    const channelName = `location:${locationSlug}:rating`

    // Subscribe to rating changes
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'location_ratings',
          filter: `location_id=eq.${locationId}`
        },
        (payload) => {
          console.log('⭐ New rating received:', payload.new)
          fetchRatingStats()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'location_ratings',
          filter: `location_id=eq.${locationId}`
        },
        (payload) => {
          console.log('⭐ Rating updated:', payload.new)
          fetchRatingStats()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'location_ratings',
          filter: `location_id=eq.${locationId}`
        },
        (payload) => {
          console.log('⭐ Rating deleted:', payload.old)
          fetchRatingStats()
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
  }, [enabled, locationId, locationSlug, fetchRatingStats, supabase])
}

