'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { TripsDashboard } from '@/components/trips/TripsDashboard'
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Trips</h1>
        <p className="text-gray-600">
          Create and manage your travel stories. Share different experiences with different audiences.
        </p>
      </div>

      <TripsDashboard userId={user.id} />
    </div>
  )
}
