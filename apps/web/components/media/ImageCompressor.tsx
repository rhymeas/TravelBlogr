'use client'

import { useState } from 'react'
import imageCompression from 'browser-image-compression'
import Compressor from 'compressorjs'

interface CompressionOptions {
  maxSizeMB: number
  maxWidthOrHeight: number
  useWebWorker: boolean
  quality: number
  format: 'jpeg' | 'png' | 'webp'
}

interface ImageCompressorProps {
  file: File
  options?: Partial<CompressionOptions>
  onCompressed: (compressedFile: File) => void
  onError: (error: Error) => void
}

const defaultOptions: CompressionOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  quality: 0.8,
  format: 'jpeg'
}

export function ImageCompressor({ 
  file, 
  options = {}, 
  onCompressed, 
  onError 
}: ImageCompressorProps) {
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressionProgress, setCompressionProgress] = useState(0)

  const finalOptions = { ...defaultOptions, ...options }

  const compressWithBrowserImageCompression = async () => {
    try {
      setIsCompressing(true)
      
      const compressedFile = await imageCompression(file, {
        maxSizeMB: finalOptions.maxSizeMB,
        maxWidthOrHeight: finalOptions.maxWidthOrHeight,
        useWebWorker: finalOptions.useWebWorker,
        onProgress: (progress) => {
          setCompressionProgress(progress)
        }
      })

      onCompressed(compressedFile)
    } catch (error) {
      onError(error as Error)
    } finally {
      setIsCompressing(false)
      setCompressionProgress(0)
    }
  }

  const compressWithCompressorJS = async () => {
    try {
      setIsCompressing(true)
      
      new Compressor(file, {
        quality: finalOptions.quality,
        maxWidth: finalOptions.maxWidthOrHeight,
        maxHeight: finalOptions.maxWidthOrHeight,
        convertTypes: ['image/png'],
        convertSize: 5000000, // 5MB
        success: (compressedFile) => {
          setIsCompressing(false)
          onCompressed(compressedFile as File)
        },
        error: (error) => {
          setIsCompressing(false)
          onError(error)
        }
      })
    } catch (error) {
      setIsCompressing(false)
      onError(error as Error)
    }
  }

  const getCompressionStats = () => {
    if (!file) return null

    const originalSize = (file.size / 1024 / 1024).toFixed(2)
    return {
      originalSize: `${originalSize} MB`,
      originalDimensions: 'Calculating...',
      estimatedCompressedSize: `~${(parseFloat(originalSize) * finalOptions.quality).toFixed(2)} MB`
    }
  }

  const stats = getCompressionStats()

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="font-medium mb-4">Image Compression</h3>
      
      {/* File Info */}
      <div className="mb-4 text-sm text-gray-600">
        <div className="grid grid-cols-2 gap-2">
          <div>Original: {stats?.originalSize}</div>
          <div>Estimated: {stats?.estimatedCompressedSize}</div>
        </div>
      </div>

      {/* Compression Options */}
      <div className="mb-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quality ({finalOptions.quality})
          </label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={finalOptions.quality}
            onChange={(e) => {
              const newOptions = { ...finalOptions, quality: parseFloat(e.target.value) }
              // Update options if needed
            }}
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
            value={finalOptions.maxSizeMB}
            onChange={(e) => {
              const newOptions = { ...finalOptions, maxSizeMB: parseFloat(e.target.value) }
              // Update options if needed
            }}
            className="w-full px-3 py-1 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Dimension (px)
          </label>
          <select
            value={finalOptions.maxWidthOrHeight}
            onChange={(e) => {
              const newOptions = { ...finalOptions, maxWidthOrHeight: parseInt(e.target.value) }
              // Update options if needed
            }}
            className="w-full px-3 py-1 border border-gray-300 rounded"
          >
            <option value={1920}>1920px (Full HD)</option>
            <option value={1280}>1280px (HD)</option>
            <option value={800}>800px (Medium)</option>
            <option value={400}>400px (Small)</option>
          </select>
        </div>
      </div>

      {/* Compression Progress */}
      {isCompressing && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Compressing...</span>
            <span>{Math.round(compressionProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${compressionProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Compression Buttons */}
      <div className="flex gap-2">
        <button
          onClick={compressWithBrowserImageCompression}
          disabled={isCompressing}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCompressing ? 'Compressing...' : 'Compress (Fast)'}
        </button>
        
        <button
          onClick={compressWithCompressorJS}
          disabled={isCompressing}
          className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCompressing ? 'Compressing...' : 'Compress (Quality)'}
        </button>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        <p><strong>Fast:</strong> Uses web workers, good for batch processing</p>
        <p><strong>Quality:</strong> Better compression ratio, preserves more detail</p>
      </div>
    </div>
  )
}

// Utility functions for batch compression
export const compressImages = async (
  files: File[],
  options: Partial<CompressionOptions> = {},
  onProgress?: (progress: number, currentFile: string) => void
): Promise<File[]> => {
  const finalOptions = { ...defaultOptions, ...options }
  const compressedFiles: File[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    
    try {
      onProgress?.(((i + 1) / files.length) * 100, file.name)
      
      const compressedFile = await imageCompression(file, {
        maxSizeMB: finalOptions.maxSizeMB,
        maxWidthOrHeight: finalOptions.maxWidthOrHeight,
        useWebWorker: finalOptions.useWebWorker
      })
      
      compressedFiles.push(compressedFile)
    } catch (error) {
      console.error(`Failed to compress ${file.name}:`, error)
      // Keep original file if compression fails
      compressedFiles.push(file)
    }
  }

  return compressedFiles
}

// Generate thumbnails
export const generateThumbnail = (
  file: File,
  maxWidth: number = 200,
  maxHeight: number = 200,
  quality: number = 0.7
): Promise<File> => {
  return new Promise((resolve, reject) => {
    new Compressor(file, {
      quality,
      maxWidth,
      maxHeight,
      success: (compressedFile) => {
        resolve(compressedFile as File)
      },
      error: reject
    })
  })
}

// Convert to WebP format
export const convertToWebP = async (
  file: File,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      
      ctx?.drawImage(img, 0, 0)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
              type: 'image/webp'
            })
            resolve(webpFile)
          } else {
            reject(new Error('Failed to convert to WebP'))
          }
        },
        'image/webp',
        quality
      )
    }

    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}
