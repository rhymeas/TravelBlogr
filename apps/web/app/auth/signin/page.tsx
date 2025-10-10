'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SignInModal } from '@/components/auth/SignInModal'

export default function SignInPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Open modal on page load
    setIsModalOpen(true)
  }, [])

  const handleClose = () => {
    setIsModalOpen(false)
    // Redirect to home when modal is closed
    router.push('/')
  }

  return (
    <SignInModal isOpen={isModalOpen} onClose={handleClose} />
  )
}
