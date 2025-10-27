"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { GalleryUploadModal } from '@/components/upload/GalleryUploadModal'

interface GalleryUploadButtonProps {
  locationId: string
  locationSlug: string
  locationName: string
}

export function GalleryUploadButton({ locationId, locationSlug, locationName }: GalleryUploadButtonProps) {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const [open, setOpen] = useState(false)

  const userDisplayName = ((user as any)?.user_metadata?.full_name) || (user?.email?.split('@')[0]) || 'Anonymous'

  const onClick = () => {
    if (!isAuthenticated) {
      try { (window as any).toast?.error?.('Please sign in to upload photos', { icon: '🔒' }) } catch {}
      return
    }
    setOpen(true)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-gray-700 hover:text-gray-900"
        onClick={onClick}
      >
        Upload Photos
      </Button>

      <GalleryUploadModal
        isOpen={open}
        title={`Add Photos to ${locationName}`}
        userId={user?.id as string}
        userDisplayName={userDisplayName}
        locationId={locationId}
        folder={locationId}
        allowMultiple={true}
        persistToGallery={true}
        locationSlug={locationSlug}
        onImageSelect={() => { /* no-op: persistence handled inside modal */ }}
        onAfterPersist={() => {
          setOpen(false)
          router.refresh()
        }}
        onClose={() => setOpen(false)}
      />
    </>
  )
}

