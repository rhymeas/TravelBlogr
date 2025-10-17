/**
 * Image Optimization Utilities
 * Provides helper functions for optimizing images across the app
 */

export interface ImageTransformOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'avif' | 'auto'
}

/**
 * Transform Supabase Storage URL with optimization parameters
 * 
 * Supabase Storage supports image transformations via query parameters:
 * - width: Resize width
 * - height: Resize height
 * - quality: JPEG/WebP quality (1-100)
 * - format: Output format (webp, avif, origin)
 * 
 * @example
 * transformSupabaseImage('https://...storage.../image.jpg', { width: 800, quality: 80, format: 'webp' })
 * // Returns: 'https://...storage.../image.jpg?width=800&quality=80&format=webp'
 */
export function transformSupabaseImage(
  url: string,
  options: ImageTransformOptions = {}
): string {
  if (!url) return url

  // Only transform Supabase Storage URLs
  if (!url.includes('supabase') && !url.includes('storage')) {
    return url
  }

  const params = new URLSearchParams()

  if (options.width) params.append('width', options.width.toString())
  if (options.height) params.append('height', options.height.toString())
  if (options.quality) params.append('quality', options.quality.toString())
  if (options.format) params.append('format', options.format)

  const queryString = params.toString()
  if (!queryString) return url

  // Add or append to existing query string
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}${queryString}`
}

/**
 * Get responsive image srcset for Supabase images
 * 
 * Generates srcset with multiple sizes for responsive images
 * 
 * @example
 * getResponsiveSrcSet('https://...storage.../image.jpg')
 * // Returns: 'https://...?width=640 640w, https://...?width=1024 1024w, ...'
 */
export function getResponsiveSrcSet(
  url: string,
  sizes: number[] = [640, 768, 1024, 1280, 1536]
): string {
  if (!url) return ''

  return sizes
    .map(size => {
      const transformedUrl = transformSupabaseImage(url, {
        width: size,
        quality: 80,
        format: 'webp'
      })
      return `${transformedUrl} ${size}w`
    })
    .join(', ')
}

/**
 * Get optimized thumbnail URL
 * 
 * @example
 * getThumbnailUrl('https://...storage.../image.jpg')
 * // Returns: 'https://...?width=400&quality=75&format=webp'
 */
export function getThumbnailUrl(url: string, size: number = 400): string {
  return transformSupabaseImage(url, {
    width: size,
    quality: 75,
    format: 'webp'
  })
}

/**
 * Get optimized cover image URL
 * 
 * @example
 * getCoverImageUrl('https://...storage.../image.jpg')
 * // Returns: 'https://...?width=1920&quality=85&format=webp'
 */
export function getCoverImageUrl(url: string): string {
  return transformSupabaseImage(url, {
    width: 1920,
    quality: 85,
    format: 'webp'
  })
}

/**
 * Preload critical images
 * 
 * @example
 * preloadImage('https://...storage.../hero.jpg')
 */
export function preloadImage(url: string): void {
  if (typeof window === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'image'
  link.href = url
  document.head.appendChild(link)
}

/**
 * Get blur data URL for placeholder
 * 
 * Creates a tiny base64-encoded placeholder for blur-up effect
 * 
 * @example
 * getBlurDataURL()
 * // Returns: 'data:image/svg+xml;base64,...'
 */
export function getBlurDataURL(width: number = 10, height: number = 10): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#e5e7eb"/>
    </svg>
  `
  const base64 = Buffer.from(svg).toString('base64')
  return `data:image/svg+xml;base64,${base64}`
}

/**
 * Lazy load images with Intersection Observer
 * 
 * @example
 * lazyLoadImages('.lazy-image')
 */
export function lazyLoadImages(selector: string = '.lazy-image'): void {
  if (typeof window === 'undefined') return
  if (!('IntersectionObserver' in window)) return

  const images = document.querySelectorAll<HTMLImageElement>(selector)

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        const src = img.dataset.src

        if (src) {
          img.src = src
          img.classList.remove('lazy-image')
          observer.unobserve(img)
        }
      }
    })
  })

  images.forEach(img => imageObserver.observe(img))
}

/**
 * Calculate optimal image dimensions while maintaining aspect ratio
 * 
 * @example
 * getOptimalDimensions(1920, 1080, 800)
 * // Returns: { width: 800, height: 450 }
 */
export function getOptimalDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight?: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight

  let width = originalWidth
  let height = originalHeight

  // Scale down to max width
  if (width > maxWidth) {
    width = maxWidth
    height = Math.round(width / aspectRatio)
  }

  // Scale down to max height if specified
  if (maxHeight && height > maxHeight) {
    height = maxHeight
    width = Math.round(height * aspectRatio)
  }

  return { width, height }
}

/**
 * Image format support detection
 */
export const imageFormatSupport = {
  webp: typeof window !== 'undefined' && document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0,
  avif: false, // Will be detected async
}

/**
 * Detect AVIF support
 */
export async function detectAVIFSupport(): Promise<boolean> {
  if (typeof window === 'undefined') return false

  return new Promise(resolve => {
    const avif = new Image()
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A='
    avif.onload = () => {
      imageFormatSupport.avif = true
      resolve(true)
    }
    avif.onerror = () => {
      imageFormatSupport.avif = false
      resolve(false)
    }
  })
}

/**
 * Get best supported image format
 */
export function getBestImageFormat(): 'avif' | 'webp' | 'auto' {
  if (imageFormatSupport.avif) return 'avif'
  if (imageFormatSupport.webp) return 'webp'
  return 'auto'
}

/**
 * Image loading priorities
 */
export type ImagePriority = 'high' | 'low' | 'auto'

/**
 * Get loading strategy based on position
 */
export function getLoadingStrategy(index: number, total: number): {
  loading: 'eager' | 'lazy'
  priority: ImagePriority
} {
  // First 2 images: eager loading with high priority
  if (index < 2) {
    return { loading: 'eager', priority: 'high' }
  }

  // Next 4 images: lazy loading with auto priority
  if (index < 6) {
    return { loading: 'lazy', priority: 'auto' }
  }

  // Rest: lazy loading with low priority
  return { loading: 'lazy', priority: 'low' }
}

/**
 * Cache control headers for images
 */
export const imageCacheHeaders = {
  // Static images (logos, icons) - cache for 1 year
  static: {
    'Cache-Control': 'public, max-age=31536000, immutable'
  },
  // User-uploaded images - cache for 1 week
  userContent: {
    'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400'
  },
  // Dynamic images - cache for 1 hour
  dynamic: {
    'Cache-Control': 'public, max-age=3600, stale-while-revalidate=600'
  }
}

