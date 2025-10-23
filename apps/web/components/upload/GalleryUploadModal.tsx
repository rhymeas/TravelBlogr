"use client"

import { useState } from "react"
import { createPortal } from 'react-dom'
import { Button } from "@/components/ui/Button"
import { MultipleImageUpload } from "@/components/upload/ImageUpload"
import { uploadLocationImage } from "@/lib/services/imageUploadService"

interface GalleryUploadModalProps {
  isOpen: boolean
  title?: string
  userId: string
  userDisplayName?: string
  locationId: string
  onClose: () => void
  onImageSelect: (url: string, path?: string) => void
  folder?: string
  allowMultiple?: boolean // default false (activity = single)
  // When true, the modal will persist uploads to the gallery via API using locationSlug
  persistToGallery?: boolean
  locationSlug?: string
  onAfterPersist?: () => void
}

export function GalleryUploadModal({
  isOpen,
  title = "Add Photos",
  userId,
  userDisplayName,
  locationId,
  onClose,
  onImageSelect,
  folder,
  allowMultiple = false,
  persistToGallery = false,
  locationSlug,
  onAfterPersist
}: GalleryUploadModalProps) {
  const [uploadMode, setUploadMode] = useState<"upload" | "url">("upload")
  const [urlInput, setUrlInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 })

  // Attribution state (parity with gallery modal)
  const [sourceType, setSourceType] = useState<'self' | 'other'>('self')
  const [sourceName, setSourceName] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [consent, setConsent] = useState(false)

  if (!isOpen) return null

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={() => !isProcessing && onClose()} />
      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-[101] w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200 p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-sleek-black">{title}</h3>
          <button onClick={() => !isProcessing && onClose()} className="pl-3 text-gray-500 hover:text-gray-700" aria-label="Close">×</button>
        </div>

        {/* Attribution */}
        <div className="space-y-2 mb-3">
          <p className="text-xs font-medium text-gray-700">Attribution</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`px-2.5 py-1 rounded-full text-xs ${sourceType==='self' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setSourceType('self')}
              disabled={isProcessing}
            >Use my name</button>
            <button
              type="button"
              className={`px-2.5 py-1 rounded-full text-xs ${sourceType==='other' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setSourceType('other')}
              disabled={isProcessing}
            >Other source</button>
          </div>
          {sourceType === 'other' ? (
            <div className="grid gap-2">
              <input
                type="text"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="Source name (required)"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                disabled={isProcessing}
              />
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="Source URL (optional)"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                disabled={isProcessing}
              />
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  disabled={isProcessing}
                />
                I confirm I have permission/ownership to upload this image
              </label>
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              Will be credited as {userDisplayName || 'your name'}
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-3 flex justify-center gap-2">
          <button
            className={`px-3 py-1 rounded-full text-sm ${uploadMode==='upload' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setUploadMode('upload')}
            disabled={isProcessing}
          >Upload</button>
          <button
            className={`px-3 py-1 rounded-full text-sm ${uploadMode==='url' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setUploadMode('url')}
            disabled={isProcessing}
          >Paste URL</button>
        </div>

        {/* Content */}
        {uploadMode === 'upload' ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center">
              <MultipleImageUpload
                bucket="location-images"
                userId={userId}
                folder={folder || locationId}
                maxFiles={allowMultiple ? 10 : 1}
                onUploadError={() => {}}
                onUploadComplete={async (items) => {
                  setIsProcessing(true)
                  const itemsOk = items.filter(i => !!i.url)

                  // If third-party, enforce consent + source name
                  if (sourceType === 'other' && (!sourceName || !consent)) {
                    setIsProcessing(false)
                    return
                  }

                  setProgress({ done: 0, total: itemsOk.length })

                  // Optional: persist directly to gallery via API
                  const userDisplay = userDisplayName || 'Anonymous'
                  const metaSource = {
                    type: sourceType,
                    name: sourceType === 'self' ? userDisplay : sourceName,
                    url: sourceType === 'other' ? (sourceUrl || null) : null,
                    consent: sourceType === 'other' ? consent : true,
                    user_id: userId,
                    user_display: userDisplay,
                  }

                  for (const item of itemsOk) {
                    try {
                      if (persistToGallery && locationSlug) {
                        await fetch('/api/admin/add-location-image', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            locationSlug,
                            imageUrl: item.url,
                            storagePath: item.path,
                            meta: { source: metaSource }
                          })
                        })
                      }
                      onImageSelect(item.url, item.path)
                    } catch {}
                    setProgress(prev => ({ ...prev, done: prev.done + 1 }))
                  }
                  setIsProcessing(false)
                  onClose()
                  try { onAfterPersist && onAfterPersist() } catch {}
                }}
              />
            </div>

            {/* Progress */}
            {isProcessing && (
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 animate-shimmer" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
              </div>
            )}

            {!isProcessing && (
              <div className="mt-1 flex items-center justify-between">
                <Button size="sm" variant="ghost" className="pl-3" onClick={onClose}>Close</Button>
                <Button size="sm" variant="outline" className="pr-3" onClick={onClose}>Done</Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              disabled={isProcessing}
            />
            <div className="mt-1 flex items-center justify-between">
              <Button size="sm" variant="ghost" className="pl-3" onClick={onClose}>Close</Button>
              <Button
                size="sm"
                className="bg-gray-900 hover:bg-black pr-3"
                disabled={!urlInput || isProcessing || (sourceType === 'other' && (!sourceName || !consent))}
                onClick={async () => {
                  setIsProcessing(true)
                  setProgress({ done: 0, total: 1 })
                  try {
                    const res = await fetch(urlInput)
                    const blob = await res.blob()
                    const file = new File([blob], 'photo.jpg', { type: blob.type || 'image/jpeg' })
                    const result = await uploadLocationImage(file, userId, locationId)
                    const imageUrl = result.url || urlInput

                    if (persistToGallery && locationSlug) {
                      const userDisplay = userDisplayName || 'Anonymous'
                      const metaSource = {
                        type: sourceType,
                        name: sourceType === 'self' ? userDisplay : sourceName,
                        url: sourceType === 'other' ? (sourceUrl || null) : null,
                        consent: sourceType === 'other' ? consent : true,
                        user_id: userId,
                        user_display: userDisplay,
                      }
                      await fetch('/api/admin/add-location-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ locationSlug, imageUrl, storagePath: result.path, meta: { source: metaSource } })
                      })
                    }

                    onImageSelect(imageUrl, result.path)
                  } catch (e) {
                    // Fallback: just use URL
                    try {
                      if (persistToGallery && locationSlug) {
                        const userDisplay = userDisplayName || 'Anonymous'
                        const metaSource = {
                          type: sourceType,
                          name: sourceType === 'self' ? userDisplay : sourceName,
                          url: sourceType === 'other' ? (sourceUrl || null) : null,
                          consent: sourceType === 'other' ? consent : true,
                          user_id: userId,
                          user_display: userDisplay,
                        }
                        await fetch('/api/admin/add-location-image', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ locationSlug, imageUrl: urlInput, meta: { source: metaSource, original_url: urlInput } })
                        })
                      }
                      onImageSelect(urlInput)
                    } catch {}
                  }
                  setProgress({ done: 1, total: 1 })
                  setIsProcessing(false)
                  onClose()
                  try { onAfterPersist && onAfterPersist() } catch {}
                }}
              >Add Photo</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modal, typeof window !== 'undefined' ? document.body : (null as any))
}

