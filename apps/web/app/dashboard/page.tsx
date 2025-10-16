'use client'

export const dynamic = 'force-dynamic'

import { useAuth } from '@/hooks/useAuth'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { DashboardLanding } from '@/components/dashboard/DashboardLanding'
import { PageLoading } from '@/components/ui/LoadingSpinner'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const { showSignIn } = useAuthModal()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Show modal instead of redirecting
      showSignIn('/dashboard')
    }
  }, [isAuthenticated, isLoading, showSignIn])

  if (isLoading) {
    return <PageLoading message="Loading your dashboard..." />
  }

  if (!isAuthenticated) {
    return <PageLoading message="Please sign in..." />
  }

  return <DashboardLanding />
}
