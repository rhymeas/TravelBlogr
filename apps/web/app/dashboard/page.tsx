'use client'

import { useAuth } from '@/hooks/useAuth'
import { DashboardLanding } from '@/components/dashboard/DashboardLanding'
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
    return (
      <div className="min-h-screen bg-airbnb-background-secondary flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rausch-500"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to sign-in
  }

  return <DashboardLanding />
}
