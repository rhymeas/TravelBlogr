'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { TripsDashboardV2 } from '@/components/trips/TripsDashboardV2'
import { TripsDashboardSkeleton } from '@/components/trips/TripsDashboardSkeleton'

export default function TripsPage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin')
    }
  }, [isAuthenticated, isLoading])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <TripsDashboardSkeleton />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null // Will redirect
  }

  return <TripsDashboardV2 userId={user.id} />
}
