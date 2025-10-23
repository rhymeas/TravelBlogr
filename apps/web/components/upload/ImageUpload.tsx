'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { uploadImage, optimizeImage, type BucketName, type UploadOptions } from '@/lib/services/imageUploadService'

interface ImageUploadProps {
  onUploadComplete: (url: string, path: string) => void
  onUploadError?: (error: string) => void
  bucket: BucketName
  userId: string
  folder?: string
  maxSizeMB?: number
  currentImage?: string
  aspectRatio?: 'square' | 'landscape' | 'portrait' | 'auto'
  label?: string
  description?: string
  optimize?: boolean
}

export function ImageUpload({
  onUploadComplete,
  onUploadError,
  bucket,
  userId,
  folder,
  maxSizeMB = 5,
  currentImage,
  aspectRatio = 'auto',
  label = 'Upload Image',
  description = 'Click to upload or drag and drop',
  optimize = true
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      const error = 'Please select an image file'
      toast.error(error)
      onUploadError?.(error)
      return
    }

    // Validate file size
    const maxSize = maxSizeMB * 1024 * 1024
    if (file.size > maxSize) {
      const error = `File size must be less than ${maxSizeMB}MB`
      toast.error(error)
      onUploadError?.(error)
      return
    }

    setIsUploading(true)

    try {
      // Show preview immediately
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Optimize image if enabled
      let fileToUpload = file
      if (optimize) {
        toast.loading('Optimizing image...')
        fileToUpload = await optimizeImage(file)
        toast.dismiss()
      }

      // Upload to Supabase
      toast.loading('Uploading image...')
      const result = await uploadImage(fileToUpload, {
        bucket,
        userId,
        folder,
        maxSizeMB
      })

      toast.dismiss()

      if (result.success && result.url && result.path) {
        toast.success('Image uploaded successfully!')
        setPreview(result.url)
        onUploadComplete(result.url, result.path)
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image'
      console.error('Upload error:', error)
      toast.error(errorMessage)
      onUploadError?.(errorMessage)
      setPreview(currentImage || null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square'
      case 'landscape':
        return 'aspect-video'
      case 'portrait':
        return 'aspect-[3/4]'
      default:
        return 'aspect-auto'
    }
  }

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={isUploading}
      />

      {preview ? (
        <div className="relative group">
          <div className={`relative ${getAspectRatioClass()} w-full overflow-hidden rounded-lg border-2 border-gray-200`}>
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
            />
          </div>
          
          {!isUploading && (
            <div className="absolute top-2 right-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/90 hover:bg-white"
              >
                <Upload className="h-4 w-4 mr-1" />
                Change
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                className="bg-white/90 hover:bg-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
              <div className="text-center text-white">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm">Uploading...</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            ${getAspectRatioClass()}
            w-full
            border-2 border-dashed rounded-lg
            flex flex-col items-center justify-center
            cursor-pointer
            transition-all
            ${isDragging 
              ? 'border-rausch-500 bg-rausch-50' 
              : 'border-gray-300 hover:border-rausch-400 hover:bg-gray-50'
            }
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-12 w-12 text-rausch-500 animate-spin mb-3" />
              <p className="text-sm text-gray-600">Uploading...</p>
            </>
          ) : (
            <>
              <ImageIcon className="h-12 w-12 text-gray-400 mb-3" />
              <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
              <p className="text-xs text-gray-500">{description}</p>
              <p className="text-xs text-gray-400 mt-2">
                Max size: {maxSizeMB}MB
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Multiple Image Upload Component
 */
interface MultipleImageUploadProps {
  onUploadComplete: (urls: Array<{ url: string; path: string }>) => void
  onUploadError?: (error: string) => void
  bucket: BucketName
  userId: string
  folder?: string
  maxSizeMB?: number
  maxFiles?: number
  currentImages?: string[]
}

export function MultipleImageUpload({
  onUploadComplete,
  onUploadError,
  bucket,
  userId,
  folder,
  maxSizeMB = 5,
  maxFiles = 10,
  currentImages = []
}: MultipleImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previews, setPreviews] = useState<string[]>(currentImages)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFilesSelect = async (files: FileList) => {
    const fileArray = Array.from(files)

    if (previews.length + fileArray.length > maxFiles) {
      const error = `Maximum ${maxFiles} images allowed`
      toast.error(error)
      onUploadError?.(error)
      return
    }

    setIsUploading(true)

    try {
      const uploadResults: Array<{ url: string; path: string }> = []

      for (const file of fileArray) {
        // Optimize and upload
        const optimized = await optimizeImage(file)
        const result = await uploadImage(optimized, {
          bucket,
          userId,
          folder,
          maxSizeMB
        })

        if (result.success && result.url && result.path) {
          uploadResults.push({ url: result.url, path: result.path })
          setPreviews(prev => [...prev, result.url].filter((url): url is string => url !== undefined))
        }
      }

      if (uploadResults.length > 0) {
        toast.success(`${uploadResults.length} image${uploadResults.length>1?'s':''} uploaded successfully!`)
        onUploadComplete(uploadResults)
      } else {
        toast.error('No images were uploaded')
        onUploadError?.('No images were uploaded')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload images'
      toast.error(errorMessage)
      onUploadError?.(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => e.target.files && handleFilesSelect(e.target.files)}
        className="hidden"
        disabled={isUploading}
      />

      <Button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading || previews.length >= maxFiles}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Add Images ({previews.length}/{maxFiles})
          </>
        )}
      </Button>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative aspect-square group">
              <Image
                src={preview}
                alt={`Preview ${index + 1}`}
                fill
                className="object-cover rounded-lg"
              />
              <button
                onClick={() => setPreviews(prev => prev.filter((_, i) => i !== index))}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

