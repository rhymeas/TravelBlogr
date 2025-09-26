import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '../../../infrastructure/database/types'

// Client-side Supabase client
export const createClientSupabase = () =>
  createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// Server-side Supabase client
export const createServerSupabase = () =>
  createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// Admin client for server actions
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Convenience client for general use
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Storage helpers
export const uploadFile = async (
  bucket: string,
  path: string,
  file: File,
  options?: { cacheControl?: string; upsert?: boolean }
) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: options?.cacheControl || '3600',
      upsert: options?.upsert || false
    })

  if (error) throw error
  return data
}

export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  
  return data.publicUrl
}

export const deleteFile = async (bucket: string, path: string) => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])
  
  if (error) throw error
}

// Real-time subscription helpers
export const subscribeToTrip = (
  tripId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`trip:${tripId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'posts',
        filter: `trip_id=eq.${tripId}`
      },
      callback
    )
    .subscribe()
}

export const subscribeToTripUpdates = (
  tripId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`trip-updates:${tripId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'trips',
        filter: `id=eq.${tripId}`
      },
      callback
    )
    .subscribe()
}

// Auth helpers
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Database helpers with retry logic
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
      }
    }
  }

  throw lastError!
}

// Type-safe query builders
export const buildTripQuery = (supabaseClient: ReturnType<typeof createClientSupabase>) => ({
  findById: (id: string) =>
    supabaseClient
      .from('trips')
      .select(`
        *,
        posts (
          id,
          title,
          content,
          featured_image,
          post_date,
          order_index
        ),
        share_links (
          id,
          link_type,
          token,
          title,
          is_active,
          view_count
        )
      `)
      .eq('id', id)
      .single(),

  findByUserId: (userId: string) =>
    supabaseClient
      .from('trips')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),

  findBySlug: (slug: string) =>
    supabaseClient
      .from('trips')
      .select('*')
      .eq('slug', slug)
      .single(),
})

export type SupabaseClient = ReturnType<typeof createClientSupabase>
