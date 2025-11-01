'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Upload, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { createProgressiveImages, createBlurDataURL } from '@/lib/utils/imageOptimization'
import toast from 'react-hot-toast'

interface ImagePreview {
  id: string
  file: File
  preview: string
  blurDataURL?: string
  isProcessing: boolean
}

interface MultiImageUploadProps {
  maxImages?: number
  onImagesChange: (files: File[]) => void
}

export function MultiImageUpload({ maxImages = 10, onImagesChange }: MultiImageUploadProps) {
  const [images, setImages] = useState<ImagePreview[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (images.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`)
      return
    }

    // Validate files
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`)
        return false
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`)
        return false
      }
      return true
    })

    // Create previews
    const newImages: ImagePreview[] = await Promise.all(
      validFiles.map(async (file) => {
        const id = Math.random().toString(36).substring(7)
        const preview = URL.createObjectURL(file)
        
        return {
          id,
          file,
          preview,
          isProcessing: true
        }
      })
    )

    setImages(prev => [...prev, ...newImages])
    onImagesChange([...images.map(img => img.file), ...validFiles])

    // Process images for progressive loading sequentially to avoid memory spikes
    for (const img of newImages) {
      try {
        const optimized = await createProgressiveImages(img.file)
        const blurDataURL = await createBlurDataURL(optimized.thumbnail)

        setImages(prev => prev.map(i =>
          i.id === img.id
            ? { ...i, blurDataURL, isProcessing: false }
            : i
        ))
      } catch (error) {
        console.error('Error processing image:', error)
        setImages(prev => prev.map(i =>
          i.id === img.id
            ? { ...i, isProcessing: false }
            : i
        ))
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (id: string) => {
    setImages(prev => {
      // Revoke object URL to free memory
      const removed = prev.find(img => img.id === id)
      if (removed) {
        try { URL.revokeObjectURL(removed.preview) } catch {}
      }

      const newImages = prev.filter(img => img.id !== id)
      onImagesChange(newImages.map(img => img.file))

      // Adjust current index if needed
      if (currentIndex >= newImages.length && newImages.length > 0) {
        setCurrentIndex(newImages.length - 1)
      }

      return newImages
    })
  }

  // Cleanup previews on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      images.forEach(img => {
        try { URL.revokeObjectURL(img.preview) } catch {}
      })
    }
  }, [])

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {images.length === 0 ? (
        // Empty state
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg hover:border-rausch-500 hover:bg-rausch-50/50 transition-colors flex flex-col items-center justify-center gap-3"
        >
          <Upload className="h-12 w-12 text-gray-400" />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">
              Click to upload images
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG up to 10MB • Max {maxImages} images
            </p>
          </div>
        </button>
      ) : (
        // Image carousel
        <div className="relative">
          {/* Main image display */}
          <div className="relative h-64 rounded-lg overflow-hidden bg-gray-100">
            <img
              src={images[currentIndex].preview}
              alt={`Upload ${currentIndex + 1}`}
              className="w-full h-full object-cover"
              style={{
                filter: images[currentIndex].isProcessing ? 'blur(10px)' : 'none',
                transition: 'filter 0.3s ease'
              }}
            />
            
            {/* Processing indicator */}
            {images[currentIndex].isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="bg-white rounded-full px-4 py-2 text-sm font-medium">
                  Processing...
                </div>
              </div>
            )}

            {/* Remove button */}
            <button
              onClick={() => removeImage(images[currentIndex].id)}
              className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-white" />
            </button>

            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-white" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                >
                  <ChevronRight className="h-5 w-5 text-white" />
                </button>
              </>
            )}

            {/* Image counter */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-medium">
              {currentIndex + 1} / {images.length}
            </div>
          </div>

          {/* Thumbnail strip */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-2">
            {images.map((img, index) => (
              <button
                key={img.id}
                onClick={() => setCurrentIndex(index)}
                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-rausch-500 ring-2 ring-rausch-200'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <img
                  src={img.preview}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {img.isProcessing && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </button>
            ))}

            {/* Add more button */}
            {images.length < maxImages && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 hover:border-rausch-500 hover:bg-rausch-50 transition-colors flex items-center justify-center"
              >
                <Plus className="h-6 w-6 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Image count info */}
      {images.length > 0 && (
        <p className="text-xs text-gray-500 text-center">
          {images.length} {images.length === 1 ? 'image' : 'images'} selected
          {images.length < maxImages && ` • ${maxImages - images.length} more allowed`}
        </p>
      )}
    </div>
  )
}

