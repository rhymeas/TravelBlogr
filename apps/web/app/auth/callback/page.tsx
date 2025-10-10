'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserSupabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = getBrowserSupabase()

        console.log('🔄 Processing OAuth callback...')

        // Get the session from the URL hash
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('❌ Auth callback error:', error)
          toast.error('Authentication failed')
          router.push('/auth/signin')
          return
        }

        if (session?.user) {
          console.log('✅ OAuth authentication successful:', session.user.email)

          // The useAuth hook will automatically handle the session via onAuthStateChange
          // No need to manually store anything - Supabase handles it!

          toast.success('Welcome! Signed in successfully')
          router.push('/dashboard')
        } else {
          console.error('⚠️ No session found after OAuth')
          toast.error('Authentication failed')
          router.push('/auth/signin')
        }
      } catch (error) {
        console.error('❌ Unexpected error in auth callback:', error)
        toast.error('An unexpected error occurred')
        router.push('/auth/signin')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-airbnb-background-secondary flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-rausch-500 mb-4"></div>
        <p className="text-body-large text-airbnb-dark-gray">Completing sign in...</p>
      </div>
    </div>
  )
}

