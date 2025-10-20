/**
 * Smart Image Component
 * Automatically handles SVG files and Next.js Image optimization
 * Routes external images through ImageKit CDN for performance
 */

import Image, { ImageProps } from 'next/image'
import { getCDNUrl } from '@/lib/image-cdn'

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

  // ✅ Route through ImageKit CDN (except SVGs and local images)
  const cdnSrc = isSVG || src.startsWith('/') ? src : getCDNUrl(src)

  // For SVG files, use unoptimized mode
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

  // For other images, use ImageKit CDN URL
  return (
    <Image
      src={cdnSrc}
      alt={alt}
      {...props}
    />
  )
}

