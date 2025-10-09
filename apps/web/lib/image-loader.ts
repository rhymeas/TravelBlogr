/**
 * Custom Image Loader for Next.js Image Optimization
 * Optimizes external images (Wikipedia, etc.) for faster loading
 */

export interface ImageLoaderProps {
  src: string
  width: number
  quality?: number
}

/**
 * Optimized image loader that:
 * 1. Uses Vercel Image Optimization for external URLs
 * 2. Adds width/quality parameters
 * 3. Handles Wikipedia images specially
 */
export function optimizedImageLoader({ src, width, quality }: ImageLoaderProps): string {
  // Handle relative URLs (local images) - add width parameter for Next.js
  if (src.startsWith('/')) {
    // For local images, just return the path (Next.js will handle optimization)
    if (quality) {
      return `${src}?w=${width}&q=${quality}`
    }
    return `${src}?w=${width}`
  }

  // Handle Wikipedia images - use thumbnail API
  if (src.includes('wikipedia.org') || src.includes('wikimedia.org')) {
    return optimizeWikipediaImage(src, width)
  }

  // For other external images, use Next.js default optimization
  // This will use Vercel's Image Optimization API in production
  const params = new URLSearchParams()
  params.set('url', src)
  params.set('w', width.toString())
  if (quality) {
    params.set('q', quality.toString())
  }

  return `/_next/image?${params.toString()}`
}

/**
 * Optimize Wikipedia/Wikimedia images using their thumbnail service
 * This is MUCH faster than loading full-resolution images
 */
function optimizeWikipediaImage(src: string, width: number): string {
  try {
    // Wikipedia thumbnail URL pattern:
    // Original: https://upload.wikimedia.org/wikipedia/commons/a/b/File.jpg
    // Thumbnail: https://upload.wikimedia.org/wikipedia/commons/thumb/a/b/File.jpg/800px-File.jpg

    // If already a thumbnail URL, update the width
    if (src.includes('/thumb/')) {
      // Extract the base path and filename
      const match = src.match(/(.+\/thumb\/.+\/)(\d+px-.+)/)
      if (match) {
        const basePath = match[1]
        const filename = match[2].replace(/^\d+px-/, '')
        return `${basePath}${width}px-${filename}`
      }
    }

    // Convert regular Wikipedia URL to thumbnail
    const match = src.match(/(.+\/commons\/)(.+\/)(.+\.(jpg|jpeg|png|gif|svg|webp))$/i)
    if (match) {
      const [, base, path, filename] = match
      return `${base}thumb/${path}${filename}/${width}px-${filename}`
    }

    // If we can't parse it, return original
    return src
  } catch (error) {
    console.error('Error optimizing Wikipedia image:', error)
    return src
  }
}

/**
 * Generate blur placeholder for images
 * Returns a tiny base64-encoded SVG for instant loading
 */
export function getBlurDataURL(width: number = 400, height: number = 300): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f3f4f6"/>
    </svg>
  `
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

/**
 * Preload critical images for faster LCP (Largest Contentful Paint)
 */
export function preloadImage(src: string, width: number = 800) {
  if (typeof window === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'image'
  link.href = optimizedImageLoader({ src, width })
  link.imageSrcset = `
    ${optimizedImageLoader({ src, width: width / 2 })} ${width / 2}w,
    ${optimizedImageLoader({ src, width })} ${width}w,
    ${optimizedImageLoader({ src, width: width * 2 })} ${width * 2}w
  `
  document.head.appendChild(link)
}

/**
 * Get responsive image sizes for different breakpoints
 * Optimized for TravelBlogr's grid layouts
 */
export function getResponsiveSizes(type: 'card' | 'hero' | 'thumbnail' | 'full' | 'gallery'): string {
  switch (type) {
    case 'thumbnail':
      // Small thumbnails (location cards, list view)
      return '(max-width: 640px) 100px, (max-width: 1024px) 150px, 200px'
    case 'card':
      // Medium cards (location grid, 3-column layout)
      return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
    case 'gallery':
      // Gallery images (masonry/grid, 3-4 columns)
      return '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
    case 'hero':
      // Hero/featured images (full width)
      return '100vw'
    case 'full':
      // Full-width content images
      return '(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px'
    default:
      return '100vw'
  }
}

/**
 * Get optimal image widths for srcset based on preset
 * Used for responsive image loading
 */
export function getOptimalWidths(type: 'card' | 'hero' | 'thumbnail' | 'full' | 'gallery'): number[] {
  switch (type) {
    case 'thumbnail':
      return [100, 150, 200, 300] // Small sizes
    case 'card':
      return [320, 480, 768, 1024, 1280] // Medium sizes
    case 'gallery':
      return [320, 480, 640, 960] // Gallery sizes
    case 'hero':
      return [640, 960, 1280, 1920, 2560] // Large sizes
    case 'full':
      return [640, 960, 1280, 1920] // Content sizes
    default:
      return [640, 960, 1280]
  }
}

