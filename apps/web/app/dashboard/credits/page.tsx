'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { PageLoading } from '@/components/ui/LoadingSpinner'
import { CreditsOverview } from '@/components/dashboard/CreditsOverview'

export default function CreditsPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return <PageLoading message="Loading credits..." />
  }

  if (!isAuthenticated) {
    return <PageLoading message="Please sign in..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="mx-auto max-w-6xl px-4 lg:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Credits & Billing</h1>
          <p className="text-gray-600">
            Manage your credits, view usage history, and purchase additional credits
          </p>
        </div>

        {/* Credits Overview */}
        <CreditsOverview />
      </div>
    </div>
  )
}

