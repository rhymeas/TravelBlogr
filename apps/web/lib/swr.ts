import useSWR, { mutate } from 'swr'
import { getBrowserSupabase } from './supabase'
import type { Database } from '../../../infrastructure/database/types'

// Generic fetcher function
const fetcher = async (url: string) => {
  const response = await fetch(url, {
    credentials: 'include' // Include cookies for authentication
  })
  if (!response.ok) {
    throw new Error('Failed to fetch data')
  }
  return response.json()
}

// Supabase fetcher for direct database queries
const supabaseFetcher = async (table: string, query?: any) => {
  const supabase = getBrowserSupabase()
  const { data, error } = await supabase.from(table).select(query || '*')
  if (error) throw error
  return data
}

// Custom hooks for different data types

// Trips hooks - fetch directly from Supabase to avoid cookie issues
export function useTrips(userId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `trips-${userId}` : null,
    async () => {
      const { getBrowserSupabase } = await import('@/lib/supabase')
      const supabase = getBrowserSupabase()

      try {
        // Fetch trips with basic data first
        const { data: trips, error: tripsError } = await supabase
          .from('trips')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (tripsError) {
          console.error('Error fetching trips:', tripsError)
          throw tripsError
        }

        if (!trips || trips.length === 0) {
          console.log('No trips found for user:', userId)
          return []
        }

        // Fetch related data separately to avoid complex join issues
        const tripIds = trips.map(t => t.id)

        // Fetch posts
        const { data: posts } = await supabase
          .from('posts')
          .select('id, trip_id, title, content, featured_image, post_date, order_index')
          .in('trip_id', tripIds)

        // Fetch share links (chunked to avoid URL-length 400 errors)
        const chunk = <T,>(arr: T[], size: number) => arr.reduce((acc: T[][], _, i) => (
          i % size ? acc : [...acc, arr.slice(i, i + size)]
        ), [])

        let shareLinks: any[] = []
        for (const ids of chunk(tripIds, 20)) {
          const { data, error } = await supabase
            .from('share_links')
            .select('id, trip_id, slug, expires_at, is_active')
            .in('trip_id', ids)
          if (!error && data) shareLinks = shareLinks.concat(data)
        }

        // Fetch trip stats (chunked as well for safety)
        let tripStats: any[] = []
        for (const ids of chunk(tripIds, 50)) {
          const { data, error } = await supabase
            .from('trip_stats')
            .select('trip_id, total_views, unique_views')
            .in('trip_id', ids)
          if (!error && data) tripStats = tripStats.concat(data)
        }

        // Combine all data
        const transformedTrips = trips.map(trip => ({
          ...trip,
          posts: posts?.filter(p => p.trip_id === trip.id) || [],
          share_links: shareLinks?.filter(s => s.trip_id === trip.id) || [],
          trip_stats: tripStats?.find(s => s.trip_id === trip.id) || { total_views: 0, unique_views: 0 }
        }))

        console.log('Fetched trips:', transformedTrips.length)
        return transformedTrips
      } catch (err) {
        console.error('Error in useTrips:', err)
        // Return empty array instead of throwing to prevent UI crash
        return []
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
      errorRetryCount: 3,
      errorRetryInterval: 1000,
    }
  )

  return {
    trips: data || [],
    isLoading,
    error,
    mutate,
    refresh: () => mutate()
  }
}

export function useTrip(tripId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    tripId ? `/api/trips/${tripId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds
    }
  )

  return {
    trip: data?.trip,
    isLoading,
    error,
    mutate,
    refresh: () => mutate()
  }
}

// Posts hooks
export function usePosts(tripId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    tripId ? `/api/trips/${tripId}/posts` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 10000, // 10 seconds
    }
  )

  return {
    posts: data?.posts || [],
    isLoading,
    error,
    mutate,
    refresh: () => mutate()
  }
}

// Share links hooks
export function useShareLinks(tripId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    tripId ? `/api/trips/${tripId}/share-links` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  )

  return {
    shareLinks: data?.shareLinks || [],
    isLoading,
    error,
    mutate,
    refresh: () => mutate()
  }
}

// User profile hook
export function useProfile(userId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `/api/users/${userId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
    }
  )

  return {
    profile: data?.profile,
    isLoading,
    error,
    mutate,
    refresh: () => mutate()
  }
}

// Analytics hooks
export function useTripAnalytics(tripId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    tripId ? `/api/trips/${tripId}/analytics` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  )

  return {
    analytics: data?.analytics,
    isLoading,
    error,
    mutate,
    refresh: () => mutate()
  }
}

// Optimistic update helpers
export const optimisticUpdate = {
  // Add new trip optimistically
  addTrip: (newTrip: any) => {
    mutate('/api/trips', (data: any) => ({
      ...data,
      trips: [newTrip, ...(data?.trips || [])]
    }), false)
  },

  // Update trip optimistically
  updateTrip: (tripId: string, updates: any) => {
    // Update trips list
    mutate('/api/trips', (data: any) => ({
      ...data,
      trips: data?.trips?.map((trip: any) => 
        trip.id === tripId ? { ...trip, ...updates } : trip
      ) || []
    }), false)

    // Update individual trip
    mutate(`/api/trips/${tripId}`, (data: any) => ({
      ...data,
      trip: { ...data?.trip, ...updates }
    }), false)
  },

  // Delete trip optimistically
  deleteTrip: (tripId: string) => {
    mutate('/api/trips', (data: any) => ({
      ...data,
      trips: data?.trips?.filter((trip: any) => trip.id !== tripId) || []
    }), false)
  },

  // Add post optimistically
  addPost: (tripId: string, newPost: any) => {
    mutate(`/api/trips/${tripId}/posts`, (data: any) => ({
      ...data,
      posts: [newPost, ...(data?.posts || [])]
    }), false)
  },

  // Update post optimistically
  updatePost: (tripId: string, postId: string, updates: any) => {
    mutate(`/api/trips/${tripId}/posts`, (data: any) => ({
      ...data,
      posts: data?.posts?.map((post: any) => 
        post.id === postId ? { ...post, ...updates } : post
      ) || []
    }), false)
  }
}

// Cache invalidation helpers
export const invalidateCache = {
  trips: () => mutate('/api/trips'),
  trip: (tripId: string) => mutate(`/api/trips/${tripId}`),
  posts: (tripId: string) => mutate(`/api/trips/${tripId}/posts`),
  shareLinks: (tripId: string) => mutate(`/api/trips/${tripId}/share-links`),
  profile: (userId: string) => mutate(`/api/users/${userId}`),
  all: () => mutate(() => true) // Invalidate all cache
}

// Preload data for better UX
export const preloadData = {
  trip: (tripId: string) => {
    mutate(`/api/trips/${tripId}`, fetcher(`/api/trips/${tripId}`))
  },
  posts: (tripId: string) => {
    mutate(`/api/trips/${tripId}/posts`, fetcher(`/api/trips/${tripId}/posts`))
  }
}

// Background sync for offline support
export const backgroundSync = {
  enable: () => {
    // Revalidate all data when coming back online
    window.addEventListener('online', () => {
      mutate(() => true)
    })
  }
}

// SWR configuration
export const swrConfig = {
  fetcher,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  refreshInterval: 0,
  dedupingInterval: 2000,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  onError: (error: any) => {
    console.error('SWR Error:', error)
    // Could integrate with error reporting service here
  }
}
