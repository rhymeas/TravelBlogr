'use client'

import { useAuth } from '@/hooks/useAuth'
import { DashboardLanding } from '@/components/dashboard/DashboardLanding'
import { PageLoading } from '@/components/ui/LoadingSpinner'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return <PageLoading message="Loading your dashboard..." />
  }

  if (!isAuthenticated) {
    return null // Will redirect to sign-in
  }

  return <DashboardLanding />
}
