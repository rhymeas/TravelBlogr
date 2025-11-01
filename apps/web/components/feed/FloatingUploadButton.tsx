'use client'

import { useState } from 'react'
import { Plus, X, Image as ImageIcon, Video, MapPin, FileText } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface FloatingUploadButtonProps {
  onUploadPhoto?: () => void
  onUploadVideo?: () => void
  onShareLocation?: () => void
  onCreatePost?: () => void
}

export function FloatingUploadButton({
  onUploadPhoto,
  onUploadVideo,
  onShareLocation,
  onCreatePost
}: FloatingUploadButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const uploadOptions = [
    {
      icon: ImageIcon,
      label: 'Photo',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      onClick: () => {
        onUploadPhoto?.()
        setIsOpen(false)
      }
    },
    {
      icon: Video,
      label: 'Video',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
      onClick: () => {
        onUploadVideo?.()
        setIsOpen(false)
      }
    },
    {
      icon: MapPin,
      label: 'Location',
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
      onClick: () => {
        onShareLocation?.()
        setIsOpen(false)
      }
    },
    {
      icon: FileText,
      label: 'Post',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100',
      onClick: () => {
        onCreatePost?.()
        setIsOpen(false)
      }
    }
  ]

  return (
    <>
      {/* Floating Button Container - Positioned relative to feed content (max-w-lg = 32rem) on desktop/tablet */}
      <div className="fixed bottom-6 right-6 md:right-[calc((100vw-32rem)/2+1rem)] z-50 flex flex-col items-end gap-3">
        {/* Upload Options - Slide up when open */}
        {isOpen && (
          <div className="flex flex-col gap-2 animate-in slide-in-from-bottom-4 duration-200">
            {uploadOptions.map((option, index) => {
              const Icon = option.icon
              return (
                <button
                  key={option.label}
                  onClick={option.onClick}
                  className={`flex items-center gap-3 px-4 py-3 rounded-full shadow-lg transition-all ${option.bgColor} group`}
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                    {option.label}
                  </span>
                  <div className={`p-2 rounded-full ${option.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Main Upload Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex items-center justify-center
            w-14 h-14 rounded-full
            bg-gradient-to-br from-rausch-500 to-rausch-600
            text-white shadow-lg
            hover:shadow-xl hover:scale-110
            transition-all duration-200
            ${isOpen ? 'rotate-45' : 'rotate-0'}
          `}
          aria-label={isOpen ? 'Close upload menu' : 'Open upload menu'}
        >
          <Plus className="h-7 w-7" />
        </button>
      </div>

      {/* Backdrop - Click to close */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

