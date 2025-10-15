'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/supabase'
import { PageLoading } from '@/components/ui/LoadingSpinner'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = useSupabase()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if we have hash params (implicit flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')

        if (accessToken) {
          // Supabase client automatically processes hash params and sets session
          // Just wait a moment for the session to be established
          await new Promise(resolve => setTimeout(resolve, 1000))
          router.push('/dashboard')
          return
        }

        // Otherwise check if we already have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('OAuth callback error:', sessionError)
          setError(sessionError.message)
          setTimeout(() => router.push('/auth/signin?error=oauth_failed'), 2000)
          return
        }

        if (session) {
          router.push('/dashboard')
        } else {
          setTimeout(() => router.push('/auth/signin'), 2000)
        }
      } catch (error) {
        console.error('OAuth callback error:', error)
        setError(error instanceof Error ? error.message : 'Unknown error')
        setTimeout(() => router.push('/auth/signin?error=oauth_failed'), 2000)
      }
    }

    handleCallback()
  }, [router, supabase])

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

