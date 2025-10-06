// TODO: Install @supabase/supabase-js package
// import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
// import type { Database } from '../../../infrastructure/database/types'

// Temporary mock types until Supabase is installed
type Database = any

// Temporary mock client until Supabase is installed
const createMockQueryBuilder = () => {
  const mockResult = { data: [], error: null }
  const mockSingleResult = { data: null, error: null }

  const queryBuilder = {
    eq: (column: string, value: any) => queryBuilder,
    neq: (column: string, value: any) => queryBuilder,
    gt: (column: string, value: any) => queryBuilder,
    gte: (column: string, value: any) => queryBuilder,
    lt: (column: string, value: any) => queryBuilder,
    lte: (column: string, value: any) => queryBuilder,
    like: (column: string, value: any) => queryBuilder,
    ilike: (column: string, value: any) => queryBuilder,
    is: (column: string, value: any) => queryBuilder,
    in: (column: string, values: any[]) => queryBuilder,
    not: (column: string, operator: string, value: any) => queryBuilder,
    or: (filters: string) => queryBuilder,
    filter: (column: string, operator: string, value: any) => queryBuilder,
    match: (query: object) => queryBuilder,
    order: (column: string, options?: any) => queryBuilder,
    limit: (count: number) => queryBuilder,
    range: (from: number, to: number) => queryBuilder,
    single: () => mockSingleResult,
    maybeSingle: () => mockSingleResult,
    then: (resolve: any) => resolve(mockResult),
    data: [],
    error: null
  }

  return queryBuilder
}

export const createClientSupabase = () => ({
  from: (table: string) => ({
    select: (columns?: string) => createMockQueryBuilder(),
    insert: (values: any) => createMockQueryBuilder(),
    update: (values: any) => createMockQueryBuilder(),
    upsert: (values: any) => createMockQueryBuilder(),
    delete: () => createMockQueryBuilder()
  }),
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: null, error: null }),
    signUp: () => Promise.resolve({ data: null, error: null }),
    signOut: () => Promise.resolve({ error: null })
  },
  storage: {
    from: (bucket: string) => ({
      upload: (path: string, file: any) => Promise.resolve({ data: null, error: null }),
      download: (path: string) => Promise.resolve({ data: null, error: null }),
      remove: (paths: string[]) => Promise.resolve({ data: null, error: null }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: '' } })
    })
  },
  channel: (name: string) => ({
    on: (event: string, config: any, callback?: any) => ({
      on: (event: string, config: any, callback?: any) => ({
        subscribe: (callback?: any) => ({
          unsubscribe: () => Promise.resolve({ error: null })
        })
      }),
      subscribe: (callback?: any) => ({
        unsubscribe: () => Promise.resolve({ error: null })
      })
    }),
    subscribe: (callback?: any) => ({
      unsubscribe: () => Promise.resolve({ error: null })
    })
  }),
  removeChannel: (channel: any) => Promise.resolve({ error: null })
})

// Temporary mock server client until Supabase is installed
export const createServerSupabase = () => createClientSupabase()

// Mock useSupabase hook for client components
export const useSupabase = () => createClientSupabase()

// Temporary mock admin client until Supabase is installed
export const supabaseAdmin = createClientSupabase()

// Convenience client for general use
export const supabase = createClientSupabase()

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
