import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Server-side Supabase client for API routes and server components
 * Uses cookie-based authentication to read user session
 *
 * IMPORTANT: Only import this in server-side code (API routes, Server Components)
 * For client-side code, use getBrowserSupabase() from lib/supabase.ts
 */
export const createServerSupabase = async () => {
  const cookieStore = await cookies()
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

/**
 * Service role client for admin operations (bypasses RLS)
 * 
 * IMPORTANT: Only use this for admin operations that need to bypass Row Level Security
 * Never expose the service role key to the client
 */
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

// Type exports
export type ServerSupabaseClient = ReturnType<typeof createServerSupabase>
export type ServiceSupabaseClient = ReturnType<typeof createServiceSupabase>

