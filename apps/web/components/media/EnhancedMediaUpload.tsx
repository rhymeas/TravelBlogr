'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image, Video, FileText, Settings, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import { useUploadThing } from '@/lib/uploadthing'
import { compressImages, generateThumbnail } from './ImageCompressor'
import toast from 'react-hot-toast'

interface EnhancedMediaUploadProps {
  endpoint: 'tripCoverImage' | 'tripPostImages' | 'tripDocuments' | 'profileAvatar'
  onUploadComplete?: (files: { url: string; name: string; thumbnail?: string }[]) => void
  maxFiles?: number
  accept?: Record<string, string[]>
  className?: string
  enableCompression?: boolean
  compressionOptions?: {
    maxSizeMB: number
    maxWidthOrHeight: number
    quality: number
  }
  generateThumbnails?: boolean
}

interface FileWithPreview extends File {
  preview?: string
  progress?: number
  error?: string
  compressed?: boolean
  originalSize?: number
  thumbnail?: string
}

export function EnhancedMediaUpload({
  endpoint,
  onUploadComplete,
  maxFiles = 10,
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'video/*': ['.mp4', '.mov', '.avi', '.mkv']
  },
  className = '',
  enableCompression = true,
  compressionOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    quality: 0.8
  },
  generateThumbnails = true
}: EnhancedMediaUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [compressing, setCompressing] = useState(false)
  const [showCompressionSettings, setShowCompressionSettings] = useState(false)
  const [currentCompressionOptions, setCurrentCompressionOptions] = useState(compressionOptions)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    onClientUploadComplete: (res) => {
      console.log('Upload completed:', res)
      const uploadedFiles = res?.map((file, index) => ({
        url: file.url,
        name: file.name || 'Uploaded file',
        thumbnail: files[index]?.thumbnail
      })) || []
      
      onUploadComplete?.(uploadedFiles)
      
      // Clean up previews and thumbnails
      files.forEach(file => {
        if (file.preview) URL.revokeObjectURL(file.preview)
        if (file.thumbnail) URL.revokeObjectURL(file.thumbnail)
      })
      
      setFiles([])
      setUploadProgress({})
      toast.success(`${uploadedFiles.length} file(s) uploaded successfully!`)
    },
    onUploadError: (error: Error) => {
      console.error('Upload error:', error)
      toast.error(`Upload failed: ${error.message}`)
    },
    onUploadProgress: (progress) => {
      setUploadProgress(prev => ({
        ...prev,
        [progress.file]: progress.progress
      }))
    },
  })

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    rejectedFiles.forEach(({ file, errors }) => {
      errors.forEach((error: any) => {
        if (error.code === 'file-too-large') {
          toast.error(`${file.name} is too large`)
        } else if (error.code === 'file-invalid-type') {
          toast.error(`${file.name} is not a supported file type`)
        } else {
          toast.error(`Error with ${file.name}: ${error.message}`)
        }
      })
    })

    // Process accepted files
    const newFiles: FileWithPreview[] = []
    
    for (const file of acceptedFiles) {
      const fileWithPreview = Object.assign(file, {
        preview: file.type.startsWith('image/') || file.type.startsWith('video/') 
          ? URL.createObjectURL(file) 
          : undefined,
        progress: 0,
        originalSize: file.size,
        compressed: false
      })

      // Generate thumbnail for images
      if (generateThumbnails && file.type.startsWith('image/')) {
        try {
          const thumbnailFile = await generateThumbnail(file, 200, 200, 0.7)
          fileWithPreview.thumbnail = URL.createObjectURL(thumbnailFile)
        } catch (error) {
          console.error('Failed to generate thumbnail:', error)
        }
      }

      newFiles.push(fileWithPreview)
    }

    setFiles(prev => {
      const combined = [...prev, ...newFiles]
      return combined.slice(0, maxFiles)
    })
  }, [maxFiles, generateThumbnails])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    multiple: maxFiles > 1,
    disabled: compressing || isUploading
  })

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev]
      const file = newFiles[index]
      
      // Clean up object URLs
      if (file.preview) URL.revokeObjectURL(file.preview)
      if (file.thumbnail) URL.revokeObjectURL(file.thumbnail)
      
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const compressFiles = async () => {
    const imageFiles = files.filter(file => file.type.startsWith('image/') && !file.compressed)
    if (imageFiles.length === 0) return

    setCompressing(true)
    try {
      const compressedFiles = await compressImages(
        imageFiles,
        currentCompressionOptions,
        (progress, fileName) => {
          setFiles(prev => prev.map(file => 
            file.name === fileName 
              ? { ...file, progress }
              : file
          ))
        }
      )

      // Replace original files with compressed versions
      setFiles(prev => prev.map(file => {
        if (file.type.startsWith('image/') && !file.compressed) {
          const compressedFile = compressedFiles.find(cf => cf.name === file.name)
          if (compressedFile) {
            return Object.assign(compressedFile, {
              preview: file.preview,
              thumbnail: file.thumbnail,
              compressed: true,
              originalSize: file.originalSize,
              progress: 0
            })
          }
        }
        return file
      }))

      toast.success(`Compressed ${imageFiles.length} image${imageFiles.length !== 1 ? 's' : ''}`)
    } catch (error) {
      console.error('Compression failed:', error)
      toast.error('Compression failed. Uploading original files.')
    } finally {
      setCompressing(false)
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    try {
      await startUpload(files)
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Upload failed. Please try again.')
    }
  }

  const getFileIcon = (file: FileWithPreview) => {
    if (file.type.startsWith('image/')) return <Image className="h-8 w-8 text-blue-500" />
    if (file.type.startsWith('video/')) return <Video className="h-8 w-8 text-purple-500" />
    return <FileText className="h-8 w-8 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getCompressionSavings = (file: FileWithPreview) => {
    if (!file.compressed || !file.originalSize) return null
    const savings = ((file.originalSize - file.size) / file.originalSize) * 100
    return savings > 0 ? `${savings.toFixed(1)}% smaller` : null
  }

  const imageFiles = files.filter(file => file.type.startsWith('image/'))
  const hasUncompressedImages = imageFiles.some(file => !file.compressed)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive && !isDragReject ? 'border-blue-500 bg-blue-50' : ''}
          ${isDragReject ? 'border-red-500 bg-red-50' : ''}
          ${compressing || isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
          ${files.length === 0 ? 'border-gray-300' : 'border-gray-200'}
        `}
      >
        <input {...getInputProps()} />
        
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        
        {isDragActive ? (
          <p className="text-blue-600 font-medium">Drop the files here...</p>
        ) : compressing ? (
          <p className="text-blue-600">Compressing images...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">
              Drag & drop files here, or <span className="text-blue-600 underline">browse</span>
            </p>
            <p className="text-sm text-gray-500">
              Max {maxFiles} file{maxFiles > 1 ? 's' : ''} • {Object.keys(accept).join(', ')}
            </p>
            {enableCompression && (
              <p className="text-xs text-green-600 mt-1">
                ✨ Images will be automatically optimized
              </p>
            )}
          </div>
        )}
      </div>

      {/* Compression Settings */}
      {enableCompression && showCompressionSettings && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Compression Settings</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCompressionSettings(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quality ({currentCompressionOptions.quality})
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={currentCompressionOptions.quality}
                onChange={(e) => setCurrentCompressionOptions(prev => ({
                  ...prev,
                  quality: parseFloat(e.target.value)
                }))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Size (MB)
              </label>
              <input
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={currentCompressionOptions.maxSizeMB}
                onChange={(e) => setCurrentCompressionOptions(prev => ({
                  ...prev,
                  maxSizeMB: parseFloat(e.target.value)
                }))}
                className="w-full px-3 py-1 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Dimension
              </label>
              <select
                value={currentCompressionOptions.maxWidthOrHeight}
                onChange={(e) => setCurrentCompressionOptions(prev => ({
                  ...prev,
                  maxWidthOrHeight: parseInt(e.target.value)
                }))}
                className="w-full px-3 py-1 border border-gray-300 rounded"
              >
                <option value={1920}>1920px</option>
                <option value={1280}>1280px</option>
                <option value={800}>800px</option>
                <option value={400}>400px</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Files to upload ({files.length})</h4>
            <div className="flex items-center gap-2">
              {enableCompression && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCompressionSettings(!showCompressionSettings)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
              
              {enableCompression && hasUncompressedImages && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={compressFiles}
                  disabled={compressing || isUploading}
                >
                  {compressing ? 'Compressing...' : `Compress ${imageFiles.length} image${imageFiles.length !== 1 ? 's' : ''}`}
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFiles([])}
                disabled={compressing || isUploading}
              >
                Clear All
              </Button>
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((file, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {/* File Preview/Icon */}
                <div className="flex-shrink-0">
                  {file.thumbnail ? (
                    <img
                      src={file.thumbnail}
                      alt={file.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    getFileIcon(file)
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    {file.compressed && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                        Compressed
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{formatFileSize(file.size)}</span>
                    {getCompressionSavings(file) && (
                      <span className="text-green-600">
                        ({getCompressionSavings(file)})
                      </span>
                    )}
                  </div>
                  
                  {file.error && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3 text-red-500" />
                      <span className="text-xs text-red-600">{file.error}</span>
                    </div>
                  )}
                  
                  {(compressing || isUploading) && file.progress !== undefined && (
                    <div className="mt-1">
                      <Progress value={file.progress} className="h-1" />
                    </div>
                  )}
                  
                  {uploadProgress[file.name] && (
                    <div className="mt-1">
                      <Progress value={uploadProgress[file.name]} className="h-1" />
                    </div>
                  )}
                </div>

                {/* Remove Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={compressing || isUploading}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <Button
          onClick={handleUpload}
          disabled={compressing || isUploading}
          className="w-full"
        >
          {compressing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Compressing...
            </>
          ) : isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload {files.length} file{files.length > 1 ? 's' : ''}
            </>
          )}
        </Button>
      )}
    </div>
  )
}
