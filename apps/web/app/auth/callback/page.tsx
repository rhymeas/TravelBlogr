'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/supabase'
import { AuthLoadingModal } from '@/components/auth/AuthLoadingModal'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = useSupabase()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)
  const [showDelayMessage, setShowDelayMessage] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let isMounted = true

    // Show delay message after 3 seconds
    const delayTimer = setTimeout(() => {
      if (isMounted) {
        setShowDelayMessage(true)
      }
    }, 3000)

    const handleCallback = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search)
        const code = searchParams.get('code')
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')

        // CRITICAL: Only check localStorage if there's NO OAuth code/token
        // If we have a code or token, we MUST process it first
        if (!code && !accessToken) {
          const storageKey = 'travelblogr-auth-token'
          const storedSession = localStorage.getItem(storageKey)

          if (storedSession) {
            try {
              const parsed = JSON.parse(storedSession)
              if (parsed?.access_token && parsed?.expires_at) {
                const expiresAt = parsed.expires_at * 1000
                if (expiresAt > Date.now()) {
                  console.log('✅ Valid session found in storage, redirecting to home')
                  window.location.href = '/'
                  return
                }
              }
            } catch (e) {
              console.warn('Failed to parse stored session:', e)
            }
          }
        }

        console.log('🔐 OAuth Callback:', {
          hasCode: !!code,
          hasAccessToken: !!accessToken,
          fullURL: window.location.href
        })

        // Check for redirect parameter
        const urlRedirect = searchParams.get('redirect') || searchParams.get('redirect_to')
        const storageRedirect = localStorage.getItem('oauth_redirect_to')

        // Default to home page (which will show dashboard for authenticated users)
        // Don't hard-code /dashboard to avoid issues with landing page logic
        const redirectTo = urlRedirect || storageRedirect || '/'

        console.log('OAuth callback - Final redirect to:', redirectTo)

        // Clear the stored redirect
        if (storageRedirect) {
          localStorage.removeItem('oauth_redirect_to')
        }

        if (accessToken) {
          console.log('✅ OAuth callback - Access token found in hash (implicit flow)')
          // Supabase client automatically processes hash params and sets session
          // Wait for session to be fully established
          await new Promise(resolve => setTimeout(resolve, 1000))
          console.log('✅ OAuth callback - Hard redirecting to:', redirectTo)
          // Use hard redirect to ensure auth state is fully loaded
          window.location.href = redirectTo
          return
        }

        if (code) {
          console.log('✅ OAuth callback - Code found (PKCE flow), waiting for Supabase to process...')

          // CRITICAL: Don't manually call exchangeCodeForSession - it hangs in React Strict Mode
          // Instead, Supabase's detectSessionInUrl will handle it automatically
          // We just need to wait for the SIGNED_IN event via onAuthStateChange

          // Wait up to 15 seconds for session to be created
          const sessionCreated = await new Promise<boolean>((resolve) => {
            const timeout = setTimeout(() => {
              console.warn('⚠️ Session creation timeout after 15 seconds')
              resolve(false)
            }, 15000)

            // Listen for SIGNED_IN event
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
              console.log('🔐 Auth state change in callback:', event, session ? '✅ Session' : '❌ No session')

              if (event === 'SIGNED_IN' && session) {
                clearTimeout(timeout)
                subscription.unsubscribe()
                resolve(true)
              }
            })
          })

          if (sessionCreated) {
            console.log('✅ Session created successfully - redirecting to:', redirectTo)
            if (isMounted) {
              setIsProcessing(false)
              setSuccess(true)

              // Wait for session to be fully established and propagated
              // This ensures AuthContext picks up the session before redirect
              await new Promise(resolve => setTimeout(resolve, 1000))

              // Use window.location.href for hard redirect to ensure auth state is fully loaded
              // This prevents the issue where header doesn't update after OAuth
              console.log('🔄 Hard redirecting to:', redirectTo)
              window.location.href = redirectTo
            }
            return
          } else {
            console.warn('⚠️ Session creation timed out')
            if (isMounted) {
              const errorMsg = 'Authentication timed out. Please try again.'
              setError(errorMsg)
              setTimeout(() => {
                if (isMounted) {
                  setIsProcessing(false)
                  window.location.href = '/auth/signin?error=timeout'
                }
              }, 2000)
            }
            return
          }
        }

        // Check if we have a session (for implicit flow or already-established sessions)
        console.log('🔍 About to check session...')

        // Add timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session check timeout')), 5000)
        )

        let session = null
        let sessionError = null

        try {
          const result = await Promise.race([sessionPromise, timeoutPromise]) as any
          session = result.data?.session
          sessionError = result.error
        } catch (error) {
          console.error('❌ Session check failed:', error)
          sessionError = error as Error
        }

        console.log('🔍 OAuth callback - Session check:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          error: sessionError?.message
        })

        if (sessionError) {
          console.error('❌ OAuth callback error:', sessionError)
          setError(sessionError.message)
          setTimeout(() => router.push('/auth/signin?error=oauth_failed'), 2000)
          return
        }

        if (session) {
          console.log('✅ OAuth callback - Session found, redirecting to:', redirectTo)
          if (isMounted) {
            setIsProcessing(false)
            setSuccess(true)
            setTimeout(() => {
              window.location.href = redirectTo
            }, 1000)
          }
        } else {
          console.log('⚠️ OAuth callback - No session, redirecting to sign in')
          if (isMounted) {
            setTimeout(() => {
              if (isMounted) {
                setIsProcessing(false)
                // Use window.location for hard redirect (more reliable than router.push)
                window.location.href = '/auth/signin'
              }
            }, 2000)
          }
        }
      } catch (error) {
        console.error('❌ OAuth callback error:', error)
        if (isMounted) {
          setError(error instanceof Error ? error.message : 'Unknown error')
          setTimeout(() => {
            if (isMounted) {
              setIsProcessing(false)
              // Use window.location for hard redirect (more reliable than router.push)
              window.location.href = '/auth/signin?error=oauth_failed'
            }
          }, 2000)
        }
      }
    }

    handleCallback()

    return () => {
      isMounted = false
      if (delayTimer) clearTimeout(delayTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps - only run on mount

  return (
    <AuthLoadingModal
      message="Completing sign in..."
      error={error}
      showDelayMessage={showDelayMessage}
      success={success}
    />
  )
}

