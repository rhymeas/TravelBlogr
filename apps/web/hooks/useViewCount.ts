'use client'

import { useEffect, useState } from 'react'
import { getBrowserSupabase } from '@/lib/supabase'

interface ViewStats {
  total_views: number
  unique_views: number
  last_view_at: string | null
  views_today: number
  views_this_week: number
  views_this_month: number
}

/**
 * Hook to fetch and display view counts for a trip
 * Automatically refreshes every 30 seconds
 * 
 * Usage:
 * const { viewCount, isLoading } = useViewCount(tripId)
 */
export function useViewCount(tripId: string | null) {
  const [stats, setStats] = useState<ViewStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!tripId) {
      setIsLoading(false)
      return
    }

    async function fetchStats() {
      try {
        const supabase = getBrowserSupabase()
        
        const { data, error } = await supabase
          .rpc('get_trip_stats', { p_trip_id: tripId })

        if (error) throw error

        if (data && data.length > 0) {
          setStats(data[0])
        } else {
          // No stats yet, return zeros
          setStats({
            total_views: 0,
            unique_views: 0,
            last_view_at: null,
            views_today: 0,
            views_this_week: 0,
            views_this_month: 0
          })
        }
        setError(null)
      } catch (err) {
        console.error('Error fetching view stats:', err)
        setError(err as Error)
        // Return zeros on error
        setStats({
          total_views: 0,
          unique_views: 0,
          last_view_at: null,
          views_today: 0,
          views_this_week: 0,
          views_this_month: 0
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [tripId])

  return {
    viewCount: stats?.total_views || 0,
    uniqueViews: stats?.unique_views || 0,
    viewsToday: stats?.views_today || 0,
    viewsThisWeek: stats?.views_this_week || 0,
    viewsThisMonth: stats?.views_this_month || 0,
    lastViewAt: stats?.last_view_at,
    stats,
    isLoading,
    error
  }
}

/**
 * Simple hook that just returns the view count number
 * For displaying in cards, badges, etc.
 */
export function useSimpleViewCount(tripId: string | null): number {
  const { viewCount } = useViewCount(tripId)
  return viewCount
}

