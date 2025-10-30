/**
 * Image Selection Modal
 * 
 * Allows users to select the best image for an activity from a gallery
 * Shows image quality scores and allows manual override
 */

import { useState } from 'react'
import { X, Check, Star, Image as ImageIcon } from 'lucide-react'
import { ScoredImage } from '@/lib/utils/imageQualityScorer'

interface ImageSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  activityName: string
  currentImage: string | null
  images: ScoredImage[]
  onSelectImage: (imageUrl: string) => void
}

export function ImageSelectionModal({
  isOpen,
  onClose,
  activityName,
  currentImage,
  images,
  onSelectImage
}: ImageSelectionModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(currentImage)

  if (!isOpen) return null

  const handleSelect = () => {
    if (selectedImage) {
      onSelectImage(selectedImage)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Select Image</h2>
            <p className="text-sm text-gray-600 mt-1">{activityName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Image Gallery */}
        <div className="flex-1 overflow-y-auto p-6">
          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <ImageIcon className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">No images available</p>
              <p className="text-sm">Try refreshing to fetch new images</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((image, idx) => {
                const isSelected = selectedImage === image.thumbnail
                const isCurrent = currentImage === image.thumbnail
                const isBest = idx === 0 // First image is best (already sorted)

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedImage(image.thumbnail)}
                    className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
                      isSelected
                        ? 'border-emerald-500 ring-4 ring-emerald-100'
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    {/* Image */}
                    <div className="aspect-video bg-gray-100 relative">
                      <img
                        src={image.thumbnail}
                        alt={image.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />

                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                        {isSelected && (
                          <div className="bg-emerald-500 text-white rounded-full p-2">
                            <Check className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex gap-1">
                        {isBest && (
                          <span className="px-2 py-0.5 bg-yellow-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            Best
                          </span>
                        )}
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full">
                            Current
                          </span>
                        )}
                      </div>

                      {/* Quality Score */}
                      <div className="absolute top-2 right-2">
                        <div className={`px-2 py-1 rounded-lg text-xs font-bold ${
                          image.score >= 80 ? 'bg-green-500 text-white' :
                          image.score >= 60 ? 'bg-yellow-500 text-white' :
                          'bg-gray-500 text-white'
                        }`}>
                          {image.score}
                        </div>
                      </div>
                    </div>

                    {/* Image Info */}
                    <div className="p-3 bg-white">
                      <p className="text-xs font-medium text-gray-900 truncate mb-1">
                        {image.title}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate mb-2">
                        {image.source}
                      </p>

                      {/* Score Breakdown */}
                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${
                            image.scoreBreakdown.resolution >= 80 ? 'bg-green-500' :
                            image.scoreBreakdown.resolution >= 60 ? 'bg-yellow-500' :
                            'bg-gray-400'
                          }`} />
                          <span className="text-gray-600">Res: {image.scoreBreakdown.resolution}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${
                            image.scoreBreakdown.aspectRatio >= 80 ? 'bg-green-500' :
                            image.scoreBreakdown.aspectRatio >= 60 ? 'bg-yellow-500' :
                            'bg-gray-400'
                          }`} />
                          <span className="text-gray-600">Ratio: {image.scoreBreakdown.aspectRatio}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${
                            image.scoreBreakdown.sourceReputation >= 80 ? 'bg-green-500' :
                            image.scoreBreakdown.sourceReputation >= 60 ? 'bg-yellow-500' :
                            'bg-gray-400'
                          }`} />
                          <span className="text-gray-600">Source: {image.scoreBreakdown.sourceReputation}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${
                            image.scoreBreakdown.titleRelevance >= 80 ? 'bg-green-500' :
                            image.scoreBreakdown.titleRelevance >= 60 ? 'bg-yellow-500' :
                            'bg-gray-400'
                          }`} />
                          <span className="text-gray-600">Match: {image.scoreBreakdown.titleRelevance}</span>
                        </div>
                      </div>

                      {/* Dimensions */}
                      <p className="text-[10px] text-gray-400 mt-1">
                        {image.width} × {image.height}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="text-sm text-gray-600">
            {images.length > 0 && (
              <>
                <span className="font-medium">{images.length}</span> images available
                {images[0] && (
                  <span className="ml-2 text-gray-500">
                    • Best score: <span className="font-medium text-emerald-600">{images[0].score}</span>
                  </span>
                )}
              </>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedImage}
              className="px-4 py-2 text-sm font-medium bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Select Image
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

