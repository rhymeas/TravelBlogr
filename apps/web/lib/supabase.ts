import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Server-side Supabase client for API routes and server components
// Updated: 2025-10-13 - Fixed to use cookie-based auth for proper session handling
export const createServerSupabase = () => {
  const cookieStore = cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

// Service role client for admin operations (bypasses RLS)
export const createServiceSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service role environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  })
}

// Client-side Supabase client for browser
export const createBrowserSupabase = () => {
  // These MUST be accessed at build time for Next.js to embed them
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

  // Debug logging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
    console.log('Supabase Anon Key:', supabaseAnonKey ? '✅ Set' : '❌ Missing')
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    const error = `Missing Supabase environment variables:
      NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅' : '❌'}
    `
    console.error(error)
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined
    }
  })
}

// Singleton instance for client-side usage
let browserClient: ReturnType<typeof createBrowserSupabase> | null = null

export const getBrowserSupabase = () => {
  if (typeof window === 'undefined') {
    throw new Error('getBrowserSupabase can only be called on the client side')
  }

  if (!browserClient) {
    browserClient = createBrowserSupabase()
  }

  return browserClient
}

// Backward compatibility alias
export const createClientSupabase = getBrowserSupabase

// Hook for React components
export const useSupabase = () => {
  // Only create client on the client side
  if (typeof window === 'undefined') {
    // Return a dummy client during SSR that won't actually be used
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    })
  }

  // Use the singleton pattern from getBrowserSupabase
  return getBrowserSupabase()
}

// Storage helpers
export const uploadFile = async (
  bucket: string,
  path: string,
  file: File,
  options?: { 
    cacheControl?: string
    upsert?: boolean
    contentType?: string
  }
) => {
  const supabase = typeof window !== 'undefined' 
    ? getBrowserSupabase() 
    : createServerSupabase()

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: options?.cacheControl || '3600',
      upsert: options?.upsert || false,
      contentType: options?.contentType || file.type
    })

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`)
  }
  
  return data
}

export const getPublicUrl = (bucket: string, path: string) => {
  const supabase = typeof window !== 'undefined' 
    ? getBrowserSupabase() 
    : createServerSupabase()
    
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  
  return data.publicUrl
}

export const deleteFile = async (bucket: string, path: string) => {
  const supabase = typeof window !== 'undefined' 
    ? getBrowserSupabase() 
    : createServerSupabase()

  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])
  
  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}

// Real-time subscription helpers (client-side only)
export const subscribeToTrip = (
  tripId: string,
  callback: (payload: any) => void
) => {
  if (typeof window === 'undefined') {
    throw new Error('Subscriptions can only be created on the client side')
  }

  return getBrowserSupabase()
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
  if (typeof window === 'undefined') {
    throw new Error('Subscriptions can only be created on the client side')
  }

  return getBrowserSupabase()
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
export const getCurrentUser = async (isServerSide = false) => {
  const supabase = isServerSide 
    ? createServerSupabase() 
    : getBrowserSupabase()
    
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    throw new Error(`Failed to get current user: ${error.message}`)
  }
  
  return user
}

export const signOut = async () => {
  if (typeof window === 'undefined') {
    throw new Error('signOut can only be called on the client side')
  }

  const { error } = await getBrowserSupabase().auth.signOut()
  
  if (error) {
    throw new Error(`Failed to sign out: ${error.message}`)
  }
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
      console.error(`Attempt ${i + 1} failed:`, lastError.message)
      
      if (i < maxRetries - 1) {
        const backoffDelay = delay * Math.pow(2, i)
        console.log(`Retrying in ${backoffDelay}ms...`)
        await new Promise(resolve => setTimeout(resolve, backoffDelay))
      }
    }
  }

  throw lastError!
}

// Type-safe query builders
export const buildTripQuery = (
  supabaseClient: ReturnType<typeof createServerSupabase> | ReturnType<typeof createBrowserSupabase>
) => ({
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

  create: (tripData: any) =>
    supabaseClient
      .from('trips')
      .insert(tripData)
      .select()
      .single(),

  update: (id: string, updates: any) =>
    supabaseClient
      .from('trips')
      .update(updates)
      .eq('id', id)
      .select()
      .single(),

  delete: (id: string) =>
    supabaseClient
      .from('trips')
      .delete()
      .eq('id', id)
})

// Types
export type SupabaseClient = ReturnType<typeof createServerSupabase> | ReturnType<typeof createBrowserSupabase>
export type ServerSupabaseClient = ReturnType<typeof createServerSupabase>
export type BrowserSupabaseClient = ReturnType<typeof createBrowserSupabase>