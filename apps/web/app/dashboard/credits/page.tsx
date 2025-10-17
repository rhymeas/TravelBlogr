'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

export default function CreditsPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin')
      } else {
        // Redirect to dashboard - credits are now in a modal
        router.push('/dashboard')
      }
    }
  }, [isAuthenticated, isLoading, router])

  return null
}

