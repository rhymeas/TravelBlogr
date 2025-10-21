'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/supabase'
import { PageLoading } from '@/components/ui/LoadingSpinner'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = useSupabase()
  const [error, setError] = useState<string | null>(null)
  const [hasRun, setHasRun] = useState(false)

  useEffect(() => {
    // Prevent infinite loop - only run once
    if (hasRun) return
    setHasRun(true)

    const handleCallback = async () => {
      try {
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

        // Check if we have hash params (implicit flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')

        if (accessToken) {
          console.log('✅ OAuth callback - Access token found in hash')
          // Supabase client automatically processes hash params and sets session
          // Just wait a moment for the session to be established
          await new Promise(resolve => setTimeout(resolve, 1000))
          console.log('✅ OAuth callback - Redirecting to:', redirectTo)
          router.push(redirectTo)
          return
        }

        // Otherwise check if we already have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('❌ OAuth callback error:', sessionError)
          setError(sessionError.message)
          setTimeout(() => router.push('/auth/signin?error=oauth_failed'), 2000)
          return
        }

        if (session) {
          console.log('✅ OAuth callback - Session found, redirecting to:', redirectTo)
          router.push(redirectTo)
        } else {
          console.log('⚠️ OAuth callback - No session, redirecting to sign in')
          setTimeout(() => router.push('/auth/signin'), 2000)
        }
      } catch (error) {
        console.error('❌ OAuth callback error:', error)
        setError(error instanceof Error ? error.message : 'Unknown error')
        setTimeout(() => router.push('/auth/signin?error=oauth_failed'), 2000)
      }
    }

    handleCallback()
  }, [router, supabase, hasRun])

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

