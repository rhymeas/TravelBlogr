'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SignInModal } from '@/components/auth/SignInModal'

export default function SignInPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')

  useEffect(() => {
    // Open modal on page load
    setIsModalOpen(true)
  }, [])

  const handleClose = (userSignedIn = false) => {
    setIsModalOpen(false)
    // If user signed in and there's a redirect, the modal will handle it
    // If user didn't sign in, redirect to home
    if (!userSignedIn) {
      router.push(redirect || '/')
    }
  }

  return (
    <SignInModal
      isOpen={isModalOpen}
      onClose={handleClose}
      redirectTo={redirect || undefined}
    />
  )
}
