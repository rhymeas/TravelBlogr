/**
 * Image Validation Service
 * Ensures image URLs are valid and not placeholders
 */

/**
 * Check if an image URL is valid and not a placeholder
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false
  if (typeof url !== 'string') return false

  // Reject placeholder images
  if (url.includes('placeholder')) return false
  if (url.includes('picsum.photos')) return false
  if (url.includes('random=')) return false

  // Must be HTTP(S) or local path
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) return false

  // CRITICAL: Reject URLs with non-Latin characters (Arabic, Berber, etc.)
  // These are often region names that got mistakenly used as image URLs
  if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u2D30-\u2D7F]/.test(url)) {
    console.warn(`❌ Invalid image URL (contains non-Latin characters): "${url.substring(0, 50)}..."`)
    return false
  }

  // Reject obviously broken URLs
  if (url.includes('undefined') || url.includes('null')) return false
  if (url.includes('NaN') || url.includes('null')) return false

  // Must have reasonable length
  if (url.length < 20 || url.length > 2000) return false

  // Must have image extension or be from known CDN (for HTTP URLs)
  if (url.startsWith('http')) {
    const hasImageExtension = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url)
    const isKnownCDN = url.includes('unsplash.com') ||
                       url.includes('imgur.com') ||
                       url.includes('reddit.com') ||
                       url.includes('imgs.search.brave.com') ||
                       url.includes('wikimedia.org') ||
                       url.includes('pexels.com') ||
                       url.includes('imagekit.io')

    if (!hasImageExtension && !isKnownCDN) {
      console.warn(`❌ Invalid image URL (no extension or known CDN): "${url.substring(0, 50)}..."`)
      return false
    }
  }

  return true
}

/**
 * Filter array of image URLs, keeping only valid ones
 */
export function filterValidImageUrls(urls: (string | null | undefined)[]): string[] {
  return urls.filter((url): url is string => isValidImageUrl(url))
}

/**
 * Validate and clean image data before saving to database
 */
export function validateImageData(data: {
  featured_image?: string | null
  gallery_images?: (string | null | undefined)[]
}): {
  featured_image: string | null
  gallery_images: string[]
  isValid: boolean
  warnings: string[]
} {
  const warnings: string[] = []
  
  // Validate featured image
  const featured_image = isValidImageUrl(data.featured_image) ? data.featured_image : null
  if (!featured_image && data.featured_image) {
    warnings.push(`Featured image URL invalid: ${data.featured_image?.substring(0, 50)}...`)
  }
  
  // Validate gallery images
  const gallery_images = filterValidImageUrls(data.gallery_images || [])
  if ((data.gallery_images?.length || 0) > gallery_images.length) {
    warnings.push(`Filtered out ${(data.gallery_images?.length || 0) - gallery_images.length} invalid gallery images`)
  }
  
  // Check for minimum images
  if (gallery_images.length === 0 && !featured_image) {
    warnings.push('No valid images found - location may appear incomplete')
  }
  
  if (gallery_images.length < 5) {
    warnings.push(`Only ${gallery_images.length} gallery images (ideal: 10+)`)
  }
  
  return {
    featured_image: featured_image || null,
    gallery_images,
    isValid: featured_image !== null || gallery_images.length > 0,
    warnings
  }
}

/**
 * Get image statistics for logging/monitoring
 */
export function getImageStats(data: {
  featured_image?: string | null
  gallery_images?: (string | null | undefined)[]
}): {
  hasFeatured: boolean
  galleryCount: number
  validCount: number
  invalidCount: number
} {
  const featured = isValidImageUrl(data.featured_image)
  const gallery = filterValidImageUrls(data.gallery_images || [])
  const invalid = (data.gallery_images?.length || 0) - gallery.length
  
  return {
    hasFeatured: featured,
    galleryCount: gallery.length,
    validCount: featured ? gallery.length + 1 : gallery.length,
    invalidCount: invalid + (featured ? 0 : (data.featured_image ? 1 : 0))
  }
}

/**
 * Format image stats for logging
 */
export function formatImageStats(stats: ReturnType<typeof getImageStats>): string {
  return `📊 Images: ${stats.validCount} valid (featured: ${stats.hasFeatured ? '✓' : '✗'}, gallery: ${stats.galleryCount}), ${stats.invalidCount} invalid`
}

