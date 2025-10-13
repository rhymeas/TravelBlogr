'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import { autoMigrateOnLogin } from '@/lib/services/guestMigrationService'

// Helper to safely get window.location.origin (SSR-safe)
const getOrigin = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}

interface Profile {
  id: string
  full_name?: string
  username?: string
  avatar_url?: string
  bio?: string
  created_at?: string
  updated_at?: string
}

interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  error: string | null
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    error: null,
  })

  const router = useRouter()
  const supabase = useSupabase()

  /**
   * Fetch user profile from Supabase database
   */
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      console.log('📋 Fetching profile for user:', userId)

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, bio, created_at, updated_at')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('❌ Error fetching profile:', error)
        return null
      }

      console.log('✅ Profile fetched successfully:', profile)
      return profile
    } catch (error) {
      console.error('❌ Unexpected error fetching profile:', error)
      return null
    }
  }

  useEffect(() => {
    /**
     * Initialize auth state and listen for auth changes
     */
    const initializeAuth = async () => {
      try {
        console.log('🔐 Initializing authentication...')

        // Get current session from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('❌ Error getting session:', sessionError)
          setState(prev => ({ ...prev, loading: false, error: sessionError.message }))
          return
        }

        if (session?.user) {
          console.log('✅ Active session found for user:', session.user.email)

          // Fetch user profile
          const profile = await fetchProfile(session.user.id)

          setState({
            user: session.user,
            profile,
            session,
            loading: false,
            error: null,
          })

          // Auto-migrate guest trips if any exist
          try {
            await autoMigrateOnLogin(session.user.id)
          } catch (migrationError) {
            console.error('⚠️ Guest trip migration failed:', migrationError)
            // Don't fail the auth if migration fails
          }
        } else {
          console.log('ℹ️ No active session found')
          setState(prev => ({ ...prev, loading: false }))
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error)
        setState(prev => ({ ...prev, loading: false }))
      }
    }

    // Set a timeout to prevent infinite loading (max 5 seconds)
    const loadingTimeout = setTimeout(() => {
      console.warn('⚠️ Auth initialization timeout - forcing loading to false')
      setState(prev => ({ ...prev, loading: false }))
    }, 5000)

    initializeAuth().finally(() => {
      clearTimeout(loadingTimeout)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event)

      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await fetchProfile(session.user.id)
        setState({
          user: session.user,
          profile,
          session,
          loading: false,
          error: null,
        })

        // Auto-migrate guest trips
        try {
          await autoMigrateOnLogin(session.user.id)
        } catch (migrationError) {
          console.error('⚠️ Guest trip migration failed:', migrationError)
        }
      } else if (event === 'SIGNED_OUT') {
        setState({
          user: null,
          profile: null,
          session: null,
          loading: false,
          error: null,
        })
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setState(prev => ({ ...prev, session }))
      }
    })

    // Cleanup subscription and timeout on unmount
    return () => {
      clearTimeout(loadingTimeout)
      subscription.unsubscribe()
    }
  }, [])

  /**
   * Sign in with email and password using real Supabase auth
   */
  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      console.log('🔐 Signing in with email:', email)

      // Use real Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('❌ Sign in error:', error.message)
        setState(prev => ({ ...prev, error: error.message, loading: false }))
        return { success: false, error: error.message }
      }

      if (!data.user || !data.session) {
        const message = 'No user data returned from sign in'
        console.error('❌', message)
        setState(prev => ({ ...prev, error: message, loading: false }))
        return { success: false, error: message }
      }

      console.log('✅ Sign in successful for user:', data.user.email)

      // Fetch user profile
      const profile = await fetchProfile(data.user.id)

      setState({
        user: data.user,
        profile,
        session: data.session,
        loading: false,
        error: null,
      })

      // Auto-migrate guest trips if any exist
      try {
        await autoMigrateOnLogin(data.user.id)
      } catch (migrationError) {
        console.error('⚠️ Guest trip migration failed:', migrationError)
        // Don't fail the login if migration fails
      }

      return { success: true, data: { user: data.user, session: data.session } }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred'
      console.error('❌ Unexpected sign in error:', error)
      setState(prev => ({ ...prev, error: message, loading: false }))
      return { success: false, error: message }
    }
  }

  /**
   * Sign up with email and password using real Supabase auth
   */
  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      console.log('📝 Signing up with email:', email)

      // Use real Supabase authentication
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata || {},
          emailRedirectTo: `${getOrigin()}/auth/callback`,
        }
      })

      if (error) {
        console.error('❌ Sign up error:', error.message)
        setState(prev => ({ ...prev, error: error.message, loading: false }))
        return { success: false, error: error.message }
      }

      console.log('✅ Sign up successful! Check email for confirmation.')
      setState(prev => ({ ...prev, loading: false }))

      // Note: User needs to confirm email before they can sign in
      // The profile will be created automatically by the database trigger
      return {
        success: true,
        data: { user: data.user, session: data.session },
        message: 'Please check your email to confirm your account'
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred'
      console.error('❌ Unexpected sign up error:', error)
      setState(prev => ({ ...prev, error: message, loading: false }))
      return { success: false, error: message }
    }
  }

  const signInWithProvider = async (provider: 'google' | 'github') => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Real Supabase OAuth sign in
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${getOrigin()}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      if (error) {
        setState(prev => ({ ...prev, error: error.message, loading: false }))
        return { success: false, error: error.message }
      }

      // OAuth will redirect, so we don't need to update state here
      return { success: true, data }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      setState(prev => ({ ...prev, error: message, loading: false }))
      return { success: false, error: message }
    }
  }

  /**
   * Sign out using real Supabase auth
   */
  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true }))

    try {
      console.log('👋 Signing out...')

      // Use real Supabase sign out
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('❌ Sign out error:', error.message)
        setState(prev => ({ ...prev, error: error.message, loading: false }))
        return { success: false, error: error.message }
      }

      console.log('✅ Sign out successful')

      setState({
        user: null,
        profile: null,
        session: null,
        loading: false,
        error: null,
      })

      router.push('/')
      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred'
      console.error('❌ Unexpected sign out error:', error)
      setState(prev => ({ ...prev, error: message, loading: false }))
      return { success: false, error: message }
    }
  }

  /**
   * Update user profile in Supabase database
   */
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!state.user) return { success: false, error: 'Not authenticated' }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      console.log('📝 Updating profile for user:', state.user.id)

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', state.user.id)
        .select()
        .single()

      if (error) {
        console.error('❌ Profile update error:', error.message)
        setState(prev => ({ ...prev, error: error.message, loading: false }))
        return { success: false, error: error.message }
      }

      console.log('✅ Profile updated successfully')
      setState(prev => ({ ...prev, profile: data, loading: false }))
      return { success: true, data }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred'
      console.error('❌ Unexpected profile update error:', error)
      setState(prev => ({ ...prev, error: message, loading: false }))
      return { success: false, error: message }
    }
  }

  /**
   * Send password reset email using real Supabase auth
   */
  const resetPassword = async (email: string) => {
    try {
      console.log('🔑 Sending password reset email to:', email)

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getOrigin()}/auth/reset-password`,
      })

      if (error) {
        console.error('❌ Password reset error:', error.message)
        return { success: false, error: error.message }
      }

      console.log('✅ Password reset email sent')
      return { success: true, message: 'Check your email for password reset instructions' }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred'
      console.error('❌ Unexpected password reset error:', error)
      return { success: false, error: message }
    }
  }

  return {
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
}