import { createClient } from '@supabase/supabase-js'

// NOTE: Server-side functions moved to lib/supabase-server.ts to avoid
// importing next/headers in client components

// Client-side Supabase client for browser
export const createBrowserSupabase = () => {
  // These MUST be accessed at build time for Next.js to embed them
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  // Debug logging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
    console.log('Supabase Anon Key:', supabaseAnonKey ? '✅ Set' : '❌ Missing')
    console.log('Site URL:', siteUrl)
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    const error = `Missing Supabase environment variables:
      NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅' : '❌'}
    `
    console.error(error)
    throw new Error('Missing Supabase environment variables')
  }

  // CRITICAL: Migrate from old storage key to new one (one-time migration)
  if (typeof window !== 'undefined') {
    const oldKey = 'travelblogr-auth-token'
    const newKey = 'sb-nchhcxokrzabbkvhzsor-auth-token'
    const oldData = localStorage.getItem(oldKey)
    const newData = localStorage.getItem(newKey)

    // If old key exists but new key doesn't, migrate
    if (oldData && !newData) {
      console.log('🔄 Migrating session from old storage key to new key')
      localStorage.setItem(newKey, oldData)
      localStorage.removeItem(oldKey)
      console.log('✅ Session migrated successfully')
    }
  }

  // Use simple Supabase client with localStorage
  // This is the most reliable approach for client-side auth
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true, // CRITICAL: Must persist session across page reloads
      autoRefreshToken: true, // CRITICAL: Auto-refresh tokens before expiry
      detectSessionInUrl: true, // CRITICAL: Detect OAuth callback params
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'sb-nchhcxokrzabbkvhzsor-auth-token', // CRITICAL: Must match Supabase's default format
      flowType: 'pkce', // Use PKCE flow for better security
    }
  })

  // Mirror auth session to server via cookie so API routes can authenticate
  // Attach once per browser session
  if (typeof window !== 'undefined') {
    // Use a flag on window to avoid duplicate listeners during HMR
    const w = window as unknown as {
      __TB_authSyncAttached?: boolean
      __TB_sessionRefreshInterval?: NodeJS.Timeout
    }

    if (!w.__TB_authSyncAttached) {
      // Listen to auth state changes
      client.auth.onAuthStateChange(async (event, session) => {
        console.log('🔐 [Supabase Client] Auth state changed:', event, session ? `✅ Session active (user: ${session.user.email})` : '❌ No session')

        try {
          console.log('🔐 [Supabase Client] Syncing to server API...')
          const response = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ event, session }),
          })
          const result = await response.json()
          console.log('🔐 [Supabase Client] Server sync result:', result)
        } catch (e) {
          console.error('❌ [Supabase Client] Failed to sync auth session to server:', e)
        }
      })

      // Refresh session every 5 minutes to keep it alive
      w.__TB_sessionRefreshInterval = setInterval(async () => {
        const { data: { session }, error } = await client.auth.getSession()
        if (session && !error) {
          console.log('🔄 Session refreshed automatically')
        }
      }, 5 * 60 * 1000) // 5 minutes

      // Initial session check on load
      client.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          console.log('✅ Session restored from storage')
        }
      })

      w.__TB_authSyncAttached = true
    }
  }

  return client
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
  const supabase = getBrowserSupabase()

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
  const supabase = getBrowserSupabase()

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  return data.publicUrl
}

export const deleteFile = async (bucket: string, path: string) => {
  const supabase = getBrowserSupabase()

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
// Note: For server-side auth, import createServerSupabase from lib/supabase-server.ts
export const getCurrentUser = async () => {
  const supabase = getBrowserSupabase()

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
  supabaseClient: ReturnType<typeof createBrowserSupabase>
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
// Note: ServerSupabaseClient is now exported from lib/supabase-server.ts
export type BrowserSupabaseClient = ReturnType<typeof createBrowserSupabase>
export type SupabaseClient = BrowserSupabaseClient