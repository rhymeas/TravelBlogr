// @ts-nocheck - UploadThing progress type issues
'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useUploadThing } from '@/lib/uploadthing'
import toast from 'react-hot-toast'

interface MediaUploadProps {
  endpoint: 'tripCoverImage' | 'tripPostImages' | 'tripDocuments' | 'profileAvatar'
  onUploadComplete?: (files: { url: string; name: string }[]) => void
  maxFiles?: number
  accept?: Record<string, string[]>
  className?: string
}

export function MediaUpload({
  endpoint,
  onUploadComplete,
  maxFiles = 1,
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
  },
  className = ''
}: MediaUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    onClientUploadComplete: (res) => {
      console.log('Upload completed:', res)
      const uploadedFiles = res?.map(file => ({
        url: file.url,
        name: file.name || 'Uploaded file'
      })) || []
      
      onUploadComplete?.(uploadedFiles)
      setFiles([])
      setUploadProgress({})
      toast.success(`${uploadedFiles.length} file(s) uploaded successfully!`)
    },
    onUploadError: (error: Error) => {
      console.error('Upload error:', error)
      toast.error(`Upload failed: ${error.message}`)
      setUploading(false)
    },
    onUploadProgress: (progress) => {
      console.log('Upload progress:', progress)
      // Update progress for each file
      setUploadProgress(prev => ({
        ...prev,
        [progress.file]: progress.progress
      }))
    },
  })

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxFiles,
    onDrop: (acceptedFiles) => {
      setFiles(prev => [...prev, ...acceptedFiles].slice(0, maxFiles))
    },
    disabled: uploading || isUploading
  })

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    try {
      await startUpload(files)
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-8 w-8 text-blue-500" />
    }
    return <FileText className="h-8 w-8 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${(uploading || isUploading) ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        
        {isDragActive ? (
          <p className="text-blue-600 font-medium">Drop the files here...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Max {maxFiles} file{maxFiles > 1 ? 's' : ''} • {Object.keys(accept).join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Selected Files</h4>
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {getFileIcon(file)}
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {uploadProgress[file.name] && (
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress[file.name]}%` }}
                    />
                  </div>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={uploading || isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <Button
          onClick={handleUpload}
          disabled={uploading || isUploading}
          className="w-full"
        >
          {(uploading || isUploading) ? (
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
