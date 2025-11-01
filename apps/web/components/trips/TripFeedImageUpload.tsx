"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ImageUpload } from '@/components/upload/ImageUpload'
import { MapPin, Camera } from 'lucide-react'
import toast from 'react-hot-toast'

interface TripFeedImageUploadProps {
  tripId: string
  onImagePosted?: () => void
}

export function TripFeedImageUpload({ tripId, onImagePosted }: TripFeedImageUploadProps) {
  const [caption, setCaption] = useState('')
  const [locationName, setLocationName] = useState('')
  const [uploading, setUploading] = useState(false)

  const handleImageUpload = async (url: string) => {
    setUploading(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/feed/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ image_url: url, caption, location_name: locationName })
      })
      if (!res.ok) throw new Error('Failed to post image')
      toast.success('Image posted to trip feed')
      setCaption('')
      setLocationName('')
      onImagePosted?.()
    } catch (e) {
      console.error(e)
      toast.error('Could not post image')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Camera className="h-4 w-4" />
        <span>Share a moment from this trip</span>
      </div>

      <ImageUpload
        bucket="trip-images"
        userId={tripId}
        onUploadComplete={(url) => handleImageUpload(url)}
        maxSizeMB={5}
      />

      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Add a caption (optional)"
        className="w-full px-3 py-2 border rounded-lg text-sm"
        rows={2}
      />

      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          placeholder="Add location (optional)"
          className="flex-1 px-3 py-2 border rounded-lg text-sm"
        />
      </div>

      <div className="flex justify-end">
        <Button disabled className="opacity-60 cursor-not-allowed">Posting via upload</Button>
      </div>
    </div>
  )
}

