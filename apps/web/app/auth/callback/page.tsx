'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/supabase'
import { PageLoading } from '@/components/ui/LoadingSpinner'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = useSupabase()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    let isMounted = true

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
        const redirectTo = urlRedirect || storageRedirect || '/'

        console.log('OAuth callback - Final redirect to:', redirectTo)

        // Clear the stored redirect
        if (storageRedirect) {
          localStorage.removeItem('oauth_redirect_to')
        }

        if (accessToken) {
          console.log('✅ OAuth callback - Access token found in hash (implicit flow)')
          // Supabase client automatically processes hash params and sets session
          // Just wait a moment for the session to be established
          await new Promise(resolve => setTimeout(resolve, 1000))
          console.log('✅ OAuth callback - Redirecting to:', redirectTo)
          router.push(redirectTo)
          return
        }

        if (code) {
          console.log('✅ OAuth callback - Code found (PKCE flow), waiting for Supabase to process...')

          // CRITICAL: Don't manually call exchangeCodeForSession - it hangs in React Strict Mode
          // Instead, Supabase's detectSessionInUrl will handle it automatically
          // We just need to wait for the SIGNED_IN event via onAuthStateChange

          // Wait up to 5 seconds for session to be created
          const sessionCreated = await new Promise<boolean>((resolve) => {
            const timeout = setTimeout(() => {
              console.warn('⚠️ Session creation timeout after 5 seconds')
              resolve(false)
            }, 5000)

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
            console.log('✅ Session created successfully, redirecting to:', redirectTo)
            if (isMounted) {
              setIsProcessing(false)
              window.location.href = redirectTo
            }
            return
          } else {
            console.warn('⚠️ Session creation timed out')
            if (isMounted) {
              setError('Authentication timed out. Please try again.')
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
            // Use window.location for hard redirect (more reliable than router.push)
            window.location.href = redirectTo
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps - only run on mount

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-sm text-muted-foreground">Redirecting to sign in...</p>
        </div>
      </div>
    )
  }

  return <PageLoading message="Completing sign in..." />
}

