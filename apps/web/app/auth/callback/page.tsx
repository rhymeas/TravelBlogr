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
        // CRITICAL: Quick check if we already have a session in localStorage
        // This prevents the hanging getSession() call in React Strict Mode
        const storageKey = 'travelblogr-auth-token'
        const storedSession = localStorage.getItem(storageKey)

        if (storedSession) {
          try {
            const parsed = JSON.parse(storedSession)
            if (parsed?.access_token && parsed?.expires_at) {
              const expiresAt = parsed.expires_at * 1000 // Convert to milliseconds
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

        // CRITICAL: Check if we're on the wrong domain (production site_url redirect)
        const currentOrigin = window.location.origin
        const isLocalhost = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')
        const isProduction = currentOrigin.includes('travelblogr.com')

        console.log('🔐 OAuth Callback:', {
          currentOrigin,
          isLocalhost,
          isProduction,
          fullURL: window.location.href
        })

        // Check for redirect parameter in multiple places:
        // 1. URL search params (redirect or redirect_to)
        // 2. localStorage (set before OAuth redirect)
        // 3. Default to home page
        const searchParams = new URLSearchParams(window.location.search)
        const urlRedirect = searchParams.get('redirect') || searchParams.get('redirect_to')
        const storageRedirect = localStorage.getItem('oauth_redirect_to')
        const redirectTo = urlRedirect || storageRedirect || '/'

        console.log('OAuth callback - Search params:', window.location.search)
        console.log('OAuth callback - URL redirect:', urlRedirect)
        console.log('OAuth callback - Storage redirect:', storageRedirect)
        console.log('OAuth callback - Final redirect to:', redirectTo)

        // Clear the stored redirect
        if (storageRedirect) {
          localStorage.removeItem('oauth_redirect_to')
        }

        // Check if we have hash params (implicit flow) or code param (PKCE flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const code = searchParams.get('code')

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
          console.log('✅ OAuth callback - Code found (PKCE flow), exchanging for session...')
          // CRITICAL: Manually exchange code for session
          // Supabase's detectSessionInUrl doesn't always work reliably
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          console.log('🔍 Code exchange result:', {
            hasData: !!data,
            hasSession: !!data?.session,
            hasUser: !!data?.user,
            error: exchangeError?.message
          })

          if (exchangeError) {
            console.error('❌ Code exchange error:', exchangeError)
            if (isMounted) {
              setError(exchangeError.message)
              setTimeout(() => {
                if (isMounted) {
                  setIsProcessing(false)
                  // Use window.location for hard redirect (more reliable than router.push)
                  window.location.href = '/auth/signin?error=code_exchange_failed'
                }
              }, 2000)
            }
            return
          }

          if (data?.session) {
            console.log('✅ Session created successfully, redirecting to:', redirectTo)
            if (isMounted) {
              setIsProcessing(false)
              // Use window.location for hard redirect (more reliable than router.push)
              window.location.href = redirectTo
            }
            return
          } else {
            console.warn('⚠️ Code exchange succeeded but no session returned')
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

