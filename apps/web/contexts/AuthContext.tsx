'use client'

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import { autoMigrateOnLogin } from '@/lib/services/guestMigrationService'
import { getCached, setCached, deleteCached, CacheKeys, CacheTTL } from '@/lib/upstash'

interface Profile {
  id: string
  full_name?: string
  username?: string
  avatar_url?: string
  bio?: string
  role?: string
  unlimited_until?: string
  coupon_type?: string
  created_at?: string
  updated_at?: string
  // Credits data (joined from user_credits table)
  credits_remaining?: number
  credits_purchased?: number
  credits_used?: number
}

interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  error: string | null
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; data?: any }>
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ success: boolean; error?: string; data?: any; message?: string }>
  signInWithProvider: (provider: 'google' | 'github', redirectTo?: string) => Promise<{ success: boolean; error?: string; data?: any; message?: string; isRedirectMode?: boolean }>
  signOut: () => Promise<{ success: boolean; error?: string }>
  updateProfile: (updates: Partial<Profile>) => Promise<{ success: boolean; error?: string }>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true, // CRITICAL: Start true to prevent race conditions on initial load
    error: null,
  })

  const router = useRouter()
  const supabase = useSupabase()

  // DEPRECATED: Replaced with Upstash Redis for persistent caching
  // const profileCacheRef = useRef<Map<string, { profile: Profile | null; timestamp: number }>>(new Map())
  // const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  // Fetch user profile with Upstash caching
  const fetchProfile = async (userId: string, forceRefresh = false): Promise<Profile | null> => {
    try {
      // Check Upstash cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedProfile = await getCached<Profile>(CacheKeys.profile(userId))
        if (cachedProfile) {
          console.log('✅ fetchProfile: Using Upstash cached profile (< 10ms)')
          return cachedProfile
        }
      }

      console.log('🔍 fetchProfile: Fetching from database for userId:', userId)

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout after 5s')), 5000)
      })

      // Fetch profile (without credits for now - foreign key doesn't exist yet)
      const queryPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      const { data, error } = await Promise.race([queryPromise, timeoutPromise])

      console.log('🔍 fetchProfile: Query completed', { data, error })

      if (error) {
        console.error('❌ Error fetching profile:', error)
        return null
      }

      console.log('✅ fetchProfile: Profile found:', data)

      // Cache the result in Upstash (5 minute TTL)
      await setCached(CacheKeys.profile(userId), data, CacheTTL.PROFILE)

      return data
    } catch (error) {
      console.error('❌ Unexpected error fetching profile:', error)
      return null
    }
  }

  // Initialize auth on mount
  useEffect(() => {
    // Check for existing session on mount
    const initializeAuth = async () => {
      console.log('🔄 Initializing auth...')

      // Debug: Check what's in localStorage
      if (typeof window !== 'undefined') {
        const storageKey = 'sb-nchhcxokrzabbkvhzsor-auth-token'
        const storedData = localStorage.getItem(storageKey)
        console.log('📦 localStorage check:', storedData ? '✅ Data exists' : '❌ No data')
        if (storedData) {
          try {
            const parsed = JSON.parse(storedData)
            console.log('📦 Stored session:', {
              hasAccessToken: !!parsed?.access_token,
              hasRefreshToken: !!parsed?.refresh_token,
              expiresAt: parsed?.expires_at ? new Date(parsed.expires_at * 1000).toISOString() : 'N/A'
            })
          } catch (e) {
            console.error('❌ Failed to parse stored session:', e)
          }
        }
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('❌ Error getting session:', error)
          setState(prev => ({ ...prev, loading: false }))
          return
        }

        if (session?.user) {
          console.log('✅ Session found on mount:', session.user.email)
          // Make header instant: set user/session immediately
          setState({
            user: session.user,
            profile: null,
            session,
            loading: false,
            error: null,
          })
          // Fetch profile in background (non-blocking UI)
          fetchProfile(session.user.id)
            .then((profile) => {
              setState(prev => ({ ...prev, profile }))
            })
            .catch(() => {/* ignore */})
        } else {
          console.log('ℹ️ No session found on mount')
          setState(prev => ({ ...prev, loading: false }))
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error)
        setState(prev => ({ ...prev, loading: false }))
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state change:', event, session ? `User: ${session.user.email}` : 'No session')

      try {
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          // Make header instant: set user/session immediately
          setState({
            user: session.user,
            profile: null,
            session,
            loading: false,
            error: null,
          })
          // Fetch profile in background (non-blocking)
          fetchProfile(session.user.id)
            .then((profile) => setState(prev => ({ ...prev, profile })))
            .catch(() => {/* ignore */})

          // Auto-migrate guest trips (only on actual sign-in, not initial session)
          if (event === 'SIGNED_IN') {
            try {
              await autoMigrateOnLogin(session.user.id)
            } catch (migrationError) {
              console.error('Guest trip migration failed:', migrationError)
            }
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out')
          setState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            error: null,
          })
        } else if (event === 'TOKEN_REFRESHED' && session) {
          console.log('🔄 Token refreshed')
          setState(prev => ({ ...prev, session }))
        } else if (event === 'INITIAL_SESSION' && !session) {
          console.log('ℹ️ No initial session found')
          setState(prev => ({ ...prev, loading: false }))
        }
      } catch (error) {
        console.error('❌ Error in auth state change handler:', error)
        // CRITICAL: Always set loading to false, even on error
        // This prevents the header from being stuck in loading state
        const errorMessage = error instanceof Error ? error.message : 'An error occurred'
        setState(prev => ({ ...prev, loading: false, error: errorMessage }))
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  // Sign in with email/password
  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setState(prev => ({ ...prev, error: error.message, loading: false }))
        return { success: false, error: error.message }
      }

      // State will be updated by onAuthStateChange listener
      return { success: true, data: { user: data.user, session: data.session } }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred'
      setState(prev => ({ ...prev, error: message, loading: false }))
      return { success: false, error: message }
    }
  }

  // Sign up with email/password
  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata || {},
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (error) {
        setState(prev => ({ ...prev, error: error.message, loading: false }))
        return { success: false, error: error.message }
      }

      setState(prev => ({ ...prev, loading: false }))
      return {
        success: true,
        data: { user: data.user, session: data.session },
        message: 'Please check your email to confirm your account'
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred'
      setState(prev => ({ ...prev, error: message, loading: false }))
      return { success: false, error: message }
    }
  }

  // Sign in with OAuth provider
  const signInWithProvider = async (provider: 'google' | 'github', redirectTo?: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const currentOrigin = window.location.origin
      const isLocalhost = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')

      // Store the CURRENT page to return to after OAuth
      const currentPage = redirectTo || window.location.pathname
      console.log('📍 Storing current page to return to:', currentPage)
      localStorage.setItem('oauth_redirect_to', currentPage)

      // For localhost: Use localhost callback URL explicitly
      // For production: Use production callback URL
      const callbackUrl = isLocalhost
        ? 'http://localhost:3000/auth/callback'
        : 'https://www.travelblogr.com/auth/callback'

      console.log('🔐 OAuth Sign-In (Seamless Redirect):', {
        provider,
        currentOrigin,
        isLocalhost,
        callbackUrl,
        currentPage,
      })

      // SIMPLE APPROACH: Just use redirect flow (works everywhere, no popup issues)
      // User will be redirected to Google, then back to the same page they were on
      const { error: redirectError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl,
          skipBrowserRedirect: false, // Allow full-page redirect
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      if (redirectError) {
        console.error('❌ OAuth error:', redirectError)
        setState(prev => ({ ...prev, error: redirectError.message, loading: false }))
        return { success: false, error: redirectError.message }
      }

      // Return success - browser will redirect to Google
      return {
        success: true,
        message: 'Redirecting to sign in...',
        isRedirectMode: true
      }


    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      console.error('❌ OAuth exception:', error)
      localStorage.removeItem('oauth_popup_mode')
      setState(prev => ({ ...prev, error: message, loading: false }))
      return { success: false, error: message }
    }
  }

  // Sign out
  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true }))

    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        setState(prev => ({ ...prev, error: error.message, loading: false }))
        return { success: false, error: error.message }
      }

      // Clear profile cache in Upstash (if user was logged in)
      if (state.user) {
        await deleteCached(CacheKeys.profile(state.user.id))
      }

      // State will be updated by onAuthStateChange listener
      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      setState(prev => ({ ...prev, error: message, loading: false }))
      return { success: false, error: message }
    }
  }

  // Update profile
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!state.user) {
      return { success: false, error: 'Not authenticated' }
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', state.user.id)

      if (error) {
        return { success: false, error: error.message }
      }

      // Invalidate Upstash cache
      await deleteCached(CacheKeys.profile(state.user.id))

      // Force refresh profile from database
      const profile = await fetchProfile(state.user.id, true)
      setState(prev => ({ ...prev, profile }))

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      return { success: false, error: message }
    }
  }

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      return { success: false, error: message }
    }
  }

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signInWithProvider,
    signOut,
    updateProfile,
    resetPassword,
    isAuthenticated: !!state.user,
    isLoading: state.loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

