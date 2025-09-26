'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '@/types'

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
  const supabase = createSupabaseClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          setState(prev => ({ ...prev, error: error.message, loading: false }))
          return
        }

        if (session?.user) {
          const profile = await fetchProfile(session.user.id)
          setState({
            user: session.user,
            profile,
            session,
            loading: false,
            error: null,
          })
        } else {
          setState(prev => ({ ...prev, loading: false }))
        }
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'An error occurred',
          loading: false 
        }))
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchProfile(session.user.id)
          setState({
            user: session.user,
            profile,
            session,
            loading: false,
            error: null,
          })
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            error: null,
          })
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setState(prev => ({
            ...prev,
            session,
            user: session.user,
          }))
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

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
      console.error('Error fetching profile:', error)
      return null
    }
  }

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

      return { success: true, data }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      setState(prev => ({ ...prev, error: message, loading: false }))
      return { success: false, error: message }
    }
  }

  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
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

  const signInWithProvider = async (provider: 'google' | 'github') => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
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

  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true }))
    
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        setState(prev => ({ ...prev, error: error.message, loading: false }))
        return { success: false, error: error.message }
      }

      router.push('/')
      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      setState(prev => ({ ...prev, error: message, loading: false }))
      return { success: false, error: message }
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!state.user) return { success: false, error: 'Not authenticated' }

    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', state.user.id)
        .select()
        .single()

      if (error) {
        setState(prev => ({ ...prev, error: error.message, loading: false }))
        return { success: false, error: error.message }
      }

      setState(prev => ({ ...prev, profile: data, loading: false }))
      return { success: true, data }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      setState(prev => ({ ...prev, error: message, loading: false }))
      return { success: false, error: message }
    }
  }

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
