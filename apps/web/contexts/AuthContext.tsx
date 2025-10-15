'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import { autoMigrateOnLogin } from '@/lib/services/guestMigrationService'

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

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; data?: any }>
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ success: boolean; error?: string; data?: any; message?: string }>
  signInWithProvider: (provider: 'google' | 'github') => Promise<{ success: boolean; error?: string; data?: any }>
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
    loading: false, // Start false to show UI immediately
    error: null,
  })

  const router = useRouter()
  const supabase = useSupabase()

  // Fetch user profile
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Unexpected error fetching profile:', error)
      return null
    }
  }

  // Initialize auth on mount
  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        const profile = await fetchProfile(session.user.id)
        setState({
          user: session.user,
          profile,
          session,
          loading: false,
          error: null,
        })

        // Auto-migrate guest trips (only on actual sign-in, not initial session)
        if (event === 'SIGNED_IN') {
          try {
            await autoMigrateOnLogin(session.user.id)
          } catch (migrationError) {
            console.error('Guest trip migration failed:', migrationError)
          }
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
      } else if (event === 'INITIAL_SESSION' && !session) {
        setState(prev => ({ ...prev, loading: false }))
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
  const signInWithProvider = async (provider: 'google' | 'github') => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
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

      return { success: true, data }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
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

      // Refresh profile
      const profile = await fetchProfile(state.user.id)
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

