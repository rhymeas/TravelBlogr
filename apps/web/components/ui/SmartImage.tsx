/**
 * Smart Image Component
 * Automatically handles SVG files and Next.js Image optimization
 */

import Image, { ImageProps } from 'next/image'

interface SmartImageProps extends Omit<ImageProps, 'src'> {
  src: string
  alt: string
}

/**
 * SmartImage component that automatically detects SVG files
 * and uses unoptimized mode for them and external images that may have issues
 */
export function SmartImage({ src, alt, ...props }: SmartImageProps) {
  // Check if the image is an SVG
  const isSVG = src.endsWith('.svg')

  // Check if it's an external image that might have optimization issues
  const isExternalImage = src.startsWith('http://') || src.startsWith('https://')

  // Check for problematic domains that don't work well with Next.js image optimization
  const problematicDomains = [
    'rawpixel.com',
    'wikimedia.org',
    'europeana.eu',
    'si.edu',
    'nypl.org',
    'loc.gov',
    'metmuseum.org',
    'flickr.com',
    'stocksnap.io'
  ]

  const hasProblematicDomain = problematicDomains.some(domain => src.includes(domain))

  // For SVG files or problematic external images, use unoptimized mode
  if (isSVG || (isExternalImage && hasProblematicDomain)) {
    return (
      <Image
        src={src}
        alt={alt}
        unoptimized
        {...props}
      />
    )
  }

  // For other images, use normal Next.js optimization
  return (
    <Image
      src={src}
      alt={alt}
      {...props}
    />
  )
}

