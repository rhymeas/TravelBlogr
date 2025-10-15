'use client'

import { useAuth } from '@/hooks/useAuth'
import { PageLoading } from '@/components/ui/LoadingSpinner'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { SettingsModal } from '@/components/settings/SettingsModal'

export default function SettingsPage() {
  const { isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin')
    }
  }, [isAuthenticated, isLoading, router])

  const handleClose = () => {
    router.back()
  }

  if (isLoading) {
    return <PageLoading message="Loading settings..." />
  }

  if (!isAuthenticated) {
    return null // Will redirect
  }

  return <SettingsModal isOpen={true} onClose={handleClose} />
}

