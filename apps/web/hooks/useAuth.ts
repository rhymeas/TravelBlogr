'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientSupabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import { autoMigrateOnLogin } from '@/lib/services/guestMigrationService'

interface Profile {
  id: string
  full_name?: string
  avatar_url?: string
  email?: string
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
  const supabase = createClientSupabase()

  // Test account credentials
  const TEST_ACCOUNTS = {
    'test@example.com': {
      password: 'password123',
      profile: {
        id: 'test-user-id',
        full_name: 'Test User',
        avatar_url: undefined,
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: new Date().toISOString(),
      }
    }
  }

  const fetchProfile = async (userId: string, email: string): Promise<Profile | null> => {
    try {
      // Return test account profile if it matches
      if (email in TEST_ACCOUNTS) {
        return TEST_ACCOUNTS[email as keyof typeof TEST_ACCOUNTS].profile
      }

      // Default demo profile for other cases
      return {
        id: userId,
        full_name: 'Demo User',
        avatar_url: undefined,
        email: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }

  useEffect(() => {
    // Get initial session from localStorage
    const getInitialSession = async () => {
      try {
        // Check if there's a stored session
        const storedSession = localStorage.getItem('mock_auth_session')
        if (storedSession) {
          const { user, profile, session } = JSON.parse(storedSession)
          setState({
            user,
            profile,
            session,
            loading: false,
            error: null,
          })
        } else {
          setState(prev => ({ ...prev, loading: false }))
        }
      } catch (error) {
        console.error('Error loading session:', error)
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'An error occurred',
          loading: false
        }))
      }
    }

    getInitialSession()
  }, [])

  const signIn = async (email: string, password: string) => {
    console.log('useAuth.signIn called with:', { email, password: password ? '***' : 'empty' })
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Validate test account credentials
      console.log('Checking if email is in TEST_ACCOUNTS:', email in TEST_ACCOUNTS)
      console.log('Available test accounts:', Object.keys(TEST_ACCOUNTS))

      if (email in TEST_ACCOUNTS) {
        const testAccount = TEST_ACCOUNTS[email as keyof typeof TEST_ACCOUNTS]
        console.log('Test account found, checking password...')
        if (password !== testAccount.password) {
          console.log('Password mismatch for test account')
          throw new Error('Invalid email or password')
        }
        console.log('Test account credentials valid!')
      } else {
        // For demo purposes, allow any other email/password combination
        console.log('Demo mode: allowing any credentials for non-test accounts')
      }

      const userId = email === 'test@example.com' ? 'test-user-id' : 'demo-user-id'

      const mockUser = {
        id: userId,
        email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        confirmation_sent_at: null,
        confirmed_at: new Date().toISOString(),
        email_confirmed_at: new Date().toISOString(),
        identities: [],
        last_sign_in_at: new Date().toISOString(),
        phone: null,
        role: 'authenticated'
      } as User

      const mockSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer',
        user: mockUser
      } as Session

      const profile = await fetchProfile(mockUser.id, email)
      console.log('Profile fetched:', profile)

      const authState = {
        user: mockUser,
        profile,
        session: mockSession,
        loading: false,
        error: null,
      }

      setState(authState)

      // Store session in localStorage for persistence
      localStorage.setItem('mock_auth_session', JSON.stringify({
        user: mockUser,
        profile,
        session: mockSession
      }))

      console.log('Authentication state updated successfully')

      // Auto-migrate guest trips if any exist
      try {
        await autoMigrateOnLogin(mockUser.id)
      } catch (migrationError) {
        console.error('Guest trip migration failed:', migrationError)
        // Don't fail the login if migration fails
      }

      return { success: true, data: { user: mockUser, session: mockSession } }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      setState(prev => ({ ...prev, error: message, loading: false }))
      return { success: false, error: message }
    }
  }

  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Mock successful sign up for demo purposes
      return { success: true, data: { user: null, session: null } }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      setState(prev => ({ ...prev, error: message, loading: false }))
      return { success: false, error: message }
    }
  }

  const signInWithProvider = async (provider: 'google' | 'github') => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Mock OAuth sign in for demo purposes
      return { success: true, data: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      setState(prev => ({ ...prev, error: message, loading: false }))
      return { success: false, error: message }
    }
  }

  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true }))

    try {
      // Clear localStorage
      localStorage.removeItem('mock_auth_session')

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
      const message = error instanceof Error ? error.message : 'An error occurred'
      setState(prev => ({ ...prev, error: message, loading: false }))
      return { success: false, error: message }
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!state.user) return { success: false, error: 'Not authenticated' }

    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Mock profile update for demo purposes
      const updatedProfile = { ...state.profile, ...updates } as Profile
      setState(prev => ({ ...prev, profile: updatedProfile, loading: false }))
      return { success: true, data: updatedProfile }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      setState(prev => ({ ...prev, error: message, loading: false }))
      return { success: false, error: message }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      // Mock password reset for demo purposes
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
