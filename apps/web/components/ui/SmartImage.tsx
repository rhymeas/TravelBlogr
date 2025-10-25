/**
 * Smart Image Component
 * Automatically handles SVG files and Next.js Image optimization
 * Routes external images through ImageKit CDN for performance
 */

import Image, { ImageProps } from 'next/image'
import { getCDNUrl, isImageKitConfigured } from '@/lib/image-cdn'

interface SmartImageProps extends Omit<ImageProps, 'src'> {
  src: string
  alt: string
}

/**
 * SmartImage component that automatically detects SVG files
 * and routes external images through ImageKit CDN for optimization
 */
export function SmartImage({ src, alt, ...props }: SmartImageProps) {
  // Check if the image is an SVG
  const isSVG = src.endsWith('.svg')

  // ✅ For SVG files, use unoptimized mode
  if (isSVG) {
    return (
      <Image
        src={src}
        alt={alt}
        unoptimized
        {...props}
      />
    )
  }

  // ✅ For local images, use Next.js Image optimization directly
  if (src.startsWith('/')) {
    return (
      <Image
        src={src}
        alt={alt}
        {...props}
      />
    )
  }

  // ✅ For external images:
  // If ImageKit is configured, use it directly (unoptimized to avoid double-encoding)
  // Otherwise, use Next.js Image optimization
  if (isImageKitConfigured()) {
    const cdnSrc = getCDNUrl(src)
    return (
      <Image
        src={cdnSrc}
        alt={alt}
        unoptimized  // ✅ CRITICAL: Prevent double-encoding with Next.js Image
        {...props}
      />
    )
  }

  // Fallback: Use Next.js Image optimization for external images
  return (
    <Image
      src={src}
      alt={alt}
      {...props}
    />
  )
}

