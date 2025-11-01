'use client'

import { useState, useRef } from 'react'
import { X, Upload, Image as ImageIcon, Video, MapPin, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { LocationAutocomplete } from './LocationAutocomplete'
import { MultiImageUpload } from './MultiImageUpload'
import { getBrowserSupabase } from '@/lib/supabase'
import { nanoid } from 'nanoid'
import { createProgressiveImages } from '@/lib/utils/imageOptimization'
import { uploadMultipleImages } from '@/lib/services/imageUploadService'

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  uploadType: 'photo' | 'video' | 'location' | 'post'
  onUploadSuccess?: () => void
  activityId?: string // For editing existing posts
}

export function UploadModal({ isOpen, onClose, uploadType, onUploadSuccess, activityId }: UploadModalProps) {
  const [caption, setCaption] = useState('')
  const [location, setLocation] = useState('')
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (uploadType === 'photo' && !file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (uploadType === 'video' && !file.type.startsWith('video/')) {
      toast.error('Please select a video file')
      return
    }

    // Validate file size (10MB for images, 50MB for videos)
    const maxSize = uploadType === 'photo' ? 10 * 1024 * 1024 : 50 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error(`File size must be less than ${uploadType === 'photo' ? '10MB' : '50MB'}`)
      return
    }

    setSelectedFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (uploadType !== 'post' && uploadType !== 'location') {
      const noFilesSelected = selectedFiles.length === 0 && !selectedFile
      if (noFilesSelected) {
        toast.error('Please select a file to upload')
        return
      }
    }

    if (!caption.trim()) {
      toast.error('Please add a caption')
      return
    }

    setIsUploading(true)

    try {
      const supabase = getBrowserSupabase()

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        toast.error('You must be signed in to upload')
        return
      }

      let imageUrls: string[] = []

      // Upload files to Supabase Storage (use signed uploads to avoid RLS issues)
      const filesToUpload = selectedFiles.length > 0 ? selectedFiles : (selectedFile ? [selectedFile] : [])

      if (filesToUpload.length > 0 && (uploadType === 'photo' || uploadType === 'video')) {
        const totalFiles = filesToUpload.length

        if (uploadType === 'photo') {
          const results = await uploadMultipleImages(
            filesToUpload,
            {
              bucket: 'trip-images',
              userId: user.id,
              folder: 'feed/photos',
              maxSizeMB: 10,
              optimize: true,
              optimizeOptions: { maxWidth: 1920, maxHeight: 1080, quality: 0.8 }
            },
            (completed) => setUploadProgress(Math.round((completed / totalFiles) * 100))
          )
          imageUrls = results.filter(r => r.success && r.url).map(r => r.url!)
          if (imageUrls.length === 0) throw new Error('All uploads failed')
        } else if (uploadType === 'video') {
          // Reuse signed upload flow for videos without optimization
          let completed = 0
          for (const file of filesToUpload) {
            // Request signed URL
            const signRes = await fetch('/api/storage/signed-upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ bucket: 'trip-images', folder: 'feed/videos', fileName: file.name })
            })
            if (!signRes.ok) {
              const err = await signRes.json().catch(() => ({}))
              throw new Error(err?.error || 'Failed to create signed URL')
            }
            const { path: filePath, token } = await signRes.json()

            // Upload using signed URL
            const { error: upErr } = await supabase.storage
              .from('trip-images')
              .uploadToSignedUrl(filePath, token, file)
            if (upErr) throw upErr

            // Public URL
            const { data: { publicUrl } } = supabase.storage
              .from('trip-images')
              .getPublicUrl(filePath)
            imageUrls.push(publicUrl)

            completed += 1
            setUploadProgress(Math.round((completed / totalFiles) * 100))
          }
        }
      }

      // Create feed activity entry
      const { error: insertError } = await supabase
        .from('activity_feed')
        .insert({
          user_id: user.id,
          type: uploadType === 'photo' ? 'photo_upload' : uploadType === 'video' ? 'video_upload' : 'post',
          data: {
            caption: caption.trim(),
            image_url: imageUrls[0] || null, // First image for backward compatibility
            images: imageUrls, // All images for carousel
            location: location.trim() || null,
            location_id: selectedLocationId,
            location_coordinates: locationCoords ? { lat: locationCoords.lat, lng: locationCoords.lng } : null
          }
        })

      if (insertError) throw insertError

      toast.success('Upload successful!')
      onUploadSuccess?.()
      onClose()

      // Reset form
      setCaption('')
      setLocation('')
      setSelectedLocationId(null)
      setSelectedFile(null)
      setSelectedFiles([])
      setPreviewUrl(null)
      setUploadProgress(0)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async () => {
    if (!activityId) return

    try {
      setIsDeleting(true)
      const supabase = getBrowserSupabase()

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        toast.error('You must be signed in to delete')
        return
      }

      // Get activity to delete associated files
      const { data: activity, error: fetchError } = await supabase
        .from('activity_feed')
        .select('data')
        .eq('id', activityId)
        .eq('user_id', user.id)
        .single()

      if (fetchError) throw fetchError

      // Delete files from storage
      if (activity?.data?.images) {
        for (const imageUrl of activity.data.images) {
          const path = imageUrl.split('/trip-images/')[1]
          if (path) {
            await supabase.storage.from('trip-images').remove([path])
          }
        }
      } else if (activity?.data?.image_url) {
        const path = activity.data.image_url.split('/trip-images/')[1]
        if (path) {
          await supabase.storage.from('trip-images').remove([path])
        }
      }

      // Delete activity from database
      const { error: deleteError } = await supabase
        .from('activity_feed')
        .delete()
        .eq('id', activityId)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

      toast.success('Post deleted successfully!')
      onUploadSuccess?.()
      onClose()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete post')
    } finally {
      setIsDeleting(false)
    }
  }

  const getTitle = () => {
    switch (uploadType) {
      case 'photo': return 'Upload Photo'
      case 'video': return 'Upload Video'
      case 'location': return 'Share Location'
      case 'post': return 'Create Post'
    }
  }

  const getIcon = () => {
    switch (uploadType) {
      case 'photo': return ImageIcon
      case 'video': return Video
      case 'location': return MapPin
      case 'post': return Upload
    }
  }

  const Icon = getIcon()

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-lg pointer-events-auto animate-in zoom-in-95 duration-200 bg-white rounded-xl shadow-2xl border border-gray-200 transform origin-top scale-[0.85]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-rausch-50">
                <Icon className="h-5 w-5 text-rausch-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{getTitle()}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* File Upload Area */}
            {uploadType === 'photo' && (
              <MultiImageUpload
                maxImages={10}
                onImagesChange={setSelectedFiles}
              />
            )}

            {uploadType === 'video' && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {previewUrl ? (
                  <div className="relative">
                    <video
                      src={previewUrl}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full h-64 rounded-lg bg-black"
                    />
                    <button
                      onClick={() => {
                        setSelectedFile(null)
                        setPreviewUrl(null)
                      }}
                      className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg hover:border-rausch-500 hover:bg-rausch-50/50 transition-colors flex flex-col items-center justify-center gap-3"
                  >
                    <Upload className="h-12 w-12 text-gray-400" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">
                        Click to upload video
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        MP4, MOV up to 50MB
                      </p>
                    </div>
                  </button>
                )}
              </div>
            )}

            {/* Caption */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Caption
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rausch-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location (optional)
              </label>
              <LocationAutocomplete
                value={location}
                onChange={(val) => { setLocation(val); if (!val) { setSelectedLocationId(null); setLocationCoords(null); } }}
                onLocationSelect={(loc) => { setSelectedLocationId(loc.id); if (loc.latitude != null && loc.longitude != null) { setLocationCoords({ lat: Number(loc.latitude), lng: Number(loc.longitude) }) } }}
                placeholder="Search for a location..."
              />
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && uploadProgress > 0 && (
            <div className="px-6 pb-4">
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-rausch-500 h-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200">
            <div>
              {activityId && (
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={isDeleting || isUploading}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isUploading || isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={isUploading || isDeleting || (selectedFiles.length === 0 && !selectedFile && uploadType !== 'post' && uploadType !== 'location')}
                className="bg-rausch-500 hover:bg-rausch-600"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  activityId ? 'Update' : 'Upload'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

