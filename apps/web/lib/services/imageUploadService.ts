import { getBrowserSupabase } from '@/lib/supabase'
import { nanoid } from 'nanoid'

/**
 * Image Upload Service
 * Handles all image uploads to Supabase Storage
 */

export type BucketName = 'trip-images' | 'profile-avatars' | 'location-images' | 'images'

export interface UploadOptions {
  bucket: BucketName
  userId: string
  folder?: string
  maxSizeMB?: number
  allowedTypes?: string[]
  optimize?: boolean
  optimizeOptions?: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
  }
}

export interface UploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
  size?: number
  dimensions?: {
    width: number
    height: number
  }
}

// Default allowed image types
const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
]

// Validate file before upload
function validateFile(
  file: File,
  maxSizeMB: number,
  allowedTypes: string[]
): { valid: boolean; error?: string } {
  // Check if file exists and has content
  if (!file || file.size === 0) {
    return { valid: false, error: 'File is empty or corrupted' }
  }

  // Validate file size
  const maxSize = maxSizeMB * 1024 * 1024
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds ${maxSizeMB}MB limit`
    }
  }

  // Validate file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type (${file.type}). Allowed types: ${allowedTypes.join(', ')}`
    }
  }

  return { valid: true }
}

/**
 * Generate a safe file path
 */
function generateFilePath(
  userId: string,
  folder: string,
  fileName: string
): string {
  // Sanitize folder name
  const safeFolder = folder.replace(/[^a-zA-Z0-9-_\/]/g, '_')
  
  // Extract file extension
  const fileExt = fileName.split('.').pop()?.toLowerCase() || 'jpg'
  
  // Generate unique filename with timestamp for better organization
  const timestamp = Date.now()
  const uniqueId = nanoid(12)
  const newFileName = `${timestamp}_${uniqueId}.${fileExt}`
  
  return `${userId}/${safeFolder}/${newFileName}`
}

/**
 * Get image dimensions
 */
async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.width, height: img.height })
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image for dimension check'))
    }
    
    img.src = url
  })
}

/**
 * Upload an image to Supabase Storage
 */
export async function uploadImage(
  file: File,
  options: UploadOptions
): Promise<UploadResult> {
  try {
    // Set defaults
    const maxSizeMB = options.maxSizeMB || 5
    const allowedTypes = options.allowedTypes || DEFAULT_ALLOWED_TYPES
    const folder = options.folder || 'uploads'

    // Validate file
    const validation = validateFile(file, maxSizeMB, allowedTypes)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      }
    }

    // Optimize image if requested
    let fileToUpload = file
    if (options.optimize) {
      try {
        fileToUpload = await optimizeImage(
          file,
          options.optimizeOptions?.maxWidth,
          options.optimizeOptions?.maxHeight,
          options.optimizeOptions?.quality
        )
        console.log(`📐 Image optimized: ${(file.size / 1024).toFixed(2)}KB → ${(fileToUpload.size / 1024).toFixed(2)}KB`)
      } catch (error) {
        console.warn('⚠️ Image optimization failed, using original:', error)
        // Continue with original file if optimization fails
      }
    }

    // Get image dimensions
    let dimensions: { width: number; height: number } | undefined
    try {
      dimensions = await getImageDimensions(fileToUpload)
    } catch (error) {
      console.warn('⚠️ Could not get image dimensions:', error)
    }

    // Generate file path
    const filePath = generateFilePath(options.userId, folder, file.name)

    console.log(`📤 Uploading image to ${options.bucket}/${filePath}`)
    console.log(`📏 Size: ${(fileToUpload.size / 1024).toFixed(2)}KB`)
    if (dimensions) {
      console.log(`📐 Dimensions: ${dimensions.width}x${dimensions.height}`)
    }

    // Get Supabase client
    const supabase = getBrowserSupabase()

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(options.bucket)
      .upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: false,
        contentType: fileToUpload.type
      })

    if (error) {
      console.error('❌ Upload error:', error)
      
      // Provide more specific error messages
      if (error.message?.includes('row-level security')) {
        return {
          success: false,
          error: 'Permission denied. Please check your authentication.'
        }
      }
      
      if (error.message?.includes('already exists')) {
        return {
          success: false,
          error: 'A file with this name already exists.'
        }
      }
      
      return {
        success: false,
        error: error.message || 'Upload failed'
      }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(options.bucket)
      .getPublicUrl(filePath)

    console.log('✅ Image uploaded successfully:', publicUrl)

    return {
      success: true,
      url: publicUrl,
      path: filePath,
      size: fileToUpload.size,
      dimensions
    }
  } catch (error) {
    console.error('❌ Unexpected upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed unexpectedly'
    }
  }
}

/**
 * Upload multiple images with progress tracking
 */
export async function uploadMultipleImages(
  files: File[],
  options: UploadOptions,
  onProgress?: (completed: number, total: number) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = []
  
  for (let i = 0; i < files.length; i++) {
    const result = await uploadImage(files[i], options)
    results.push(result)
    
    if (onProgress) {
      onProgress(i + 1, files.length)
    }
  }
  
  return results
}

/**
 * Delete an image from Supabase Storage
 */
export async function deleteImage(
  bucket: BucketName,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!path) {
      return {
        success: false,
        error: 'No path provided'
      }
    }

    const supabase = getBrowserSupabase()

    console.log(`🗑️ Deleting image from ${bucket}/${path}`)

    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      console.error('❌ Delete error:', error)
      return {
        success: false,
        error: error.message
      }
    }

    console.log('✅ Image deleted successfully')

    return { success: true }
  } catch (error) {
    console.error('❌ Unexpected delete error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    }
  }
}

/**
 * Delete multiple images
 */
export async function deleteMultipleImages(
  bucket: BucketName,
  paths: string[]
): Promise<{ success: boolean; error?: string; failed?: string[] }> {
  try {
    // Filter out empty paths
    const validPaths = paths.filter(path => path && path.length > 0)
    
    if (validPaths.length === 0) {
      return {
        success: false,
        error: 'No valid paths provided'
      }
    }

    const supabase = getBrowserSupabase()

    console.log(`🗑️ Deleting ${validPaths.length} images from ${bucket}`)

    const { error, data } = await supabase.storage
      .from(bucket)
      .remove(validPaths)

    if (error) {
      console.error('❌ Delete error:', error)
      return {
        success: false,
        error: error.message
      }
    }

    console.log('✅ Images deleted successfully')

    return { success: true }
  } catch (error) {
    console.error('❌ Unexpected delete error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    }
  }
}

/**
 * Get public URL for an image
 */
export function getImageUrl(bucket: BucketName, path: string): string {
  const supabase = getBrowserSupabase()
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  return publicUrl
}

/**
 * Upload trip cover image
 */
export async function uploadTripCoverImage(
  file: File,
  userId: string,
  tripId: string
): Promise<UploadResult> {
  return uploadImage(file, {
    bucket: 'trip-images',
    userId,
    folder: `${tripId}/cover`,
    maxSizeMB: 5,
    optimize: true,
    optimizeOptions: {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.9
    }
  })
}

/**
 * Upload trip gallery images
 */
export async function uploadTripGalleryImages(
  files: File[],
  userId: string,
  tripId: string,
  onProgress?: (completed: number, total: number) => void
): Promise<UploadResult[]> {
  return uploadMultipleImages(
    files,
    {
      bucket: 'trip-images',
      userId,
      folder: `${tripId}/gallery`,
      maxSizeMB: 5,
      optimize: true,
      optimizeOptions: {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85
      }
    },
    onProgress
  )
}

/**
 * Upload profile avatar
 */
export async function uploadProfileAvatar(
  file: File,
  userId: string
): Promise<UploadResult> {
  return uploadImage(file, {
    bucket: 'profile-avatars',
    userId,
    folder: 'avatars',
    maxSizeMB: 2,
    optimize: true,
    optimizeOptions: {
      maxWidth: 512,
      maxHeight: 512,
      quality: 0.9
    }
  })
}

/**
 * Upload location image (community contribution)
 */
export async function uploadLocationImage(
  file: File,
  userId: string,
  locationId: string
): Promise<UploadResult> {
  return uploadImage(file, {
    bucket: 'location-images',
    userId,
    folder: locationId,
    maxSizeMB: 5,
    optimize: true,
    optimizeOptions: {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.85
    }
  })
}

/**
 * Optimize image before upload (client-side)
 * Resizes and compresses the image
 */
export async function optimizeImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.85
): Promise<File> {
  // Check if browser supports required APIs
  if (!HTMLCanvasElement.prototype.toBlob) {
    console.warn('Browser does not support canvas.toBlob, returning original file')
    return file
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // Skip optimization if image is already smaller than target
          if (width <= maxWidth && height <= maxHeight) {
            // Still compress if file is large
            if (file.size < 500 * 1024) { // Less than 500KB
              resolve(file)
              return
            }
          }

          // Calculate new dimensions while maintaining aspect ratio
          const aspectRatio = width / height
          
          if (width > maxWidth || height > maxHeight) {
            if (aspectRatio > maxWidth / maxHeight) {
              width = maxWidth
              height = Math.round(maxWidth / aspectRatio)
            } else {
              height = maxHeight
              width = Math.round(maxHeight * aspectRatio)
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }

          // Use better image smoothing
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob'))
                return
              }

              const optimizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              })

              resolve(optimizedFile)
            },
            'image/jpeg',
            quality
          )
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Generate thumbnail URL using Supabase image transformation
 */
export function getThumbnailUrl(
  bucket: BucketName,
  path: string,
  width: number = 200,
  height: number = 200
): string {
  const supabase = getBrowserSupabase()
  
  // Note: This requires Supabase image transformation to be enabled
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path, {
      transform: {
        width,
        height,
        resize: 'cover'
      }
    })
    
  return publicUrl
}