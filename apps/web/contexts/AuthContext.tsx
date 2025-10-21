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
  role?: string
  unlimited_until?: string
  coupon_type?: string
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
    // Check for existing session on mount
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Error getting session:', error)
          setState(prev => ({ ...prev, loading: false }))
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
        console.error('Error initializing auth:', error)
        setState(prev => ({ ...prev, loading: false }))
      }
    }

    initializeAuth()

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
  const signInWithProvider = async (provider: 'google' | 'github', redirectTo?: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const currentOrigin = window.location.origin
      const isLocalhost = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')

      // Store the redirect path for after OAuth completes (only if provided)
      if (redirectTo) {
        console.log('📍 Storing redirect path:', redirectTo)
        localStorage.setItem('oauth_redirect_to', redirectTo)
      } else {
        console.log('📍 No redirect path - will stay on current page')
      }

      // Mark that we're using popup mode
      localStorage.setItem('oauth_popup_mode', 'true')

      // For localhost: Use localhost callback URL explicitly
      // For production: Use production callback URL
      const callbackUrl = isLocalhost
        ? 'http://localhost:3000/auth/callback'
        : 'https://www.travelblogr.com/auth/callback'

      console.log('🔐 OAuth Sign-In (Popup Mode):', {
        provider,
        currentOrigin,
        isLocalhost,
        callbackUrl,
        redirectTo,
        storedRedirect: localStorage.getItem('oauth_redirect_to')
      })

      // Get OAuth URL from Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl,
          skipBrowserRedirect: true, // CRITICAL: Don't redirect, we'll open popup manually
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      if (error) {
        console.error('❌ OAuth error:', error)
        localStorage.removeItem('oauth_popup_mode')
        setState(prev => ({ ...prev, error: error.message, loading: false }))
        return { success: false, error: error.message }
      }

      if (!data?.url) {
        console.error('❌ No OAuth URL returned')
        localStorage.removeItem('oauth_popup_mode')
        setState(prev => ({ ...prev, error: 'Failed to get OAuth URL', loading: false }))
        return { success: false, error: 'Failed to get OAuth URL' }
      }

      // Open OAuth in popup window
      const width = 500
      const height = 600
      const left = window.screen.width / 2 - width / 2
      const top = window.screen.height / 2 - height / 2

      const popup = window.open(
        data.url,
        'oauth-popup',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
      )

      // Detect if popup was blocked
      // Only check if popup is null or if the closed property doesn't exist
      // Don't check popup.closed immediately as it might not be set yet
      const isPopupBlocked = !popup || typeof popup.closed === 'undefined'

      if (isPopupBlocked) {
        console.warn('⚠️ Popup blocked - falling back to full-page redirect')
        console.log('📱 This is common on mobile browsers and when popup blockers are enabled')

        // Clean up popup mode flag since we're doing full-page redirect
        localStorage.removeItem('oauth_popup_mode')

        // Store that we're using redirect mode (for callback page to know)
        localStorage.setItem('oauth_redirect_mode', 'true')

        // Show user-friendly message
        setState(prev => ({
          ...prev,
          loading: true,
          error: null
        }))

        // Fallback: Use full-page redirect (works on ALL browsers/mobile)
        console.log('🔄 Redirecting to OAuth provider (full-page mode)...')

        // Do full-page redirect - Supabase will handle this automatically
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
          console.error('❌ Redirect OAuth error:', redirectError)
          setState(prev => ({ ...prev, error: redirectError.message, loading: false }))
          return { success: false, error: redirectError.message }
        }

        // Return success with a message indicating we're using redirect mode
        return {
          success: true,
          message: 'Redirecting to sign in...',
          isRedirectMode: true
        }
      }

      // Popup opened successfully!
      console.log('✅ OAuth popup opened successfully')

      // Monitor popup for early closure (user closed it manually)
      const popupCheckInterval = setInterval(() => {
        if (popup.closed) {
          clearInterval(popupCheckInterval)
          console.log('ℹ️ Popup was closed by user')
          setState(prev => ({ ...prev, loading: false }))
        }
      }, 500)

      console.log('✅ OAuth popup opened')

      // Listen for messages from popup
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return

        if (event.data.type === 'OAUTH_SUCCESS') {
          console.log('✅ OAuth success message received from popup')
          localStorage.removeItem('oauth_popup_mode')
          try {
            if (popup && !popup.closed) {
              popup.close()
            }
          } catch (e) {
            // Ignore COOP errors when trying to close popup
            console.log('Note: Could not close popup (COOP policy), it will close itself')
          }

          // Keep loading state and wait for session to be established
          console.log('⏳ Waiting for session to be established...')

          // First check if session already exists
          const { data: { session: existingSession } } = await supabase.auth.getSession()

          let sessionEstablished = false

          if (existingSession) {
            console.log('✅ Session already exists!')
            sessionEstablished = true
          } else {
            // Wait for auth state change
            sessionEstablished = await new Promise<boolean>((resolve) => {
              const timeout = setTimeout(() => {
                console.warn('⚠️ Session establishment timeout')
                resolve(false)
              }, 10000) // 10 second timeout

              const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                console.log('🔐 Auth state change after popup:', event, session ? '✅ Session' : '❌ No session')

                if (event === 'SIGNED_IN' && session) {
                  clearTimeout(timeout)
                  subscription.unsubscribe()
                  resolve(true)
                }
              })
            })
          }

          if (sessionEstablished) {
            console.log('✅ Session established successfully')
            setState(prev => ({ ...prev, loading: false }))

            // Get redirect path
            const redirectPath = localStorage.getItem('oauth_redirect_to')
            localStorage.removeItem('oauth_redirect_to')

            // Only redirect if a specific path was requested
            // Otherwise, stay on current page and let the UI update naturally
            if (redirectPath && redirectPath !== window.location.pathname) {
              console.log('🔐 Redirecting to:', redirectPath)
              router.push(redirectPath)
            } else {
              console.log('✅ Staying on current page, UI will update automatically')
            }
          } else {
            console.error('❌ Failed to establish session')
            setState(prev => ({
              ...prev,
              error: 'Failed to complete sign in. Please try again.',
              loading: false
            }))
          }

          window.removeEventListener('message', handleMessage)
          clearTimeout(timeoutId)
        } else if (event.data.type === 'OAUTH_ERROR') {
          console.error('❌ OAuth error message received from popup:', event.data.error)
          localStorage.removeItem('oauth_popup_mode')
          setState(prev => ({ ...prev, error: event.data.error, loading: false }))
          window.removeEventListener('message', handleMessage)
          clearTimeout(timeoutId)
        }
      }

      window.addEventListener('message', handleMessage)

      // Timeout: If no message received after 60 seconds, assume failure
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ OAuth timeout - no response from popup after 60 seconds')
        localStorage.removeItem('oauth_popup_mode')
        setState(prev => ({
          ...prev,
          error: 'Authentication timed out. Please try again.',
          loading: false
        }))
        window.removeEventListener('message', handleMessage)
      }, 60000)

      return { success: true, data }
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

