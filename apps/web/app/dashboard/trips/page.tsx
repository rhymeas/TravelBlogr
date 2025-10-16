'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { TripsDashboardV2 } from '@/components/trips/TripsDashboardV2'
import { TripsDashboardSkeleton } from '@/components/trips/TripsDashboardSkeleton'

export default function TripsPage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const { showSignIn } = useAuthModal()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Show modal instead of redirecting
      showSignIn('/dashboard/trips')
    }
  }, [isAuthenticated, isLoading, showSignIn])

  if (isLoading) {
    return <TripsDashboardSkeleton />
  }

  if (!isAuthenticated || !user) {
    // Show skeleton while modal is open
    return <TripsDashboardSkeleton />
  }

  return <TripsDashboardV2 userId={user.id} />
}
