'use client'

import Image, { ImageProps } from 'next/image'
import { useState } from 'react'
import { getBlurDataURL, getResponsiveSizes } from '@/lib/image-loader'

interface OptimizedImageProps extends Omit<ImageProps, 'loader' | 'placeholder' | 'blurDataURL'> {
  /**
   * Preset size configuration for common use cases
   */
  preset?: 'card' | 'hero' | 'thumbnail' | 'full'
  
  /**
   * Show loading skeleton while image loads
   */
  showSkeleton?: boolean
  
  /**
   * Fallback image if src fails to load
   */
  fallbackSrc?: string
}

/**
 * Optimized Image Component with:
 * - Automatic Wikipedia thumbnail optimization
 * - AVIF/WebP format support
 * - Lazy loading by default
 * - Blur placeholder
 * - Error handling with fallback
 * - Loading skeleton
 */
export function OptimizedImage({
  src,
  alt,
  preset,
  showSkeleton = true,
  fallbackSrc = '/placeholder-location.jpg',
  quality = 75,
  loading = 'lazy',
  sizes,
  priority = false,
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Use preset sizes if provided
  const imageSizes = sizes || (preset ? getResponsiveSizes(preset) : undefined)

  // Handle image load error
  const handleError = () => {
    if (!hasError) {
      setHasError(true)
      setImgSrc(fallbackSrc)
    }
  }

  // Handle image load complete
  const handleLoad = () => {
    setIsLoading(false)
  }

  return (
    <div className="relative w-full h-full">
      {/* Loading Skeleton */}
      {showSkeleton && isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      {/* Optimized Image */}
      <Image
        {...props}
        src={imgSrc}
        alt={alt}
        quality={quality}
        loading={priority ? undefined : loading}
        priority={priority}
        sizes={imageSizes}
        placeholder="blur"
        blurDataURL={getBlurDataURL()}
        onLoad={handleLoad}
        onError={handleError}
        className={`${props.className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
      />
    </div>
  )
}

