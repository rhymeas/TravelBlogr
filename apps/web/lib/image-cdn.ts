/**
 * Cloudinary Image CDN
 * Routes all external images through Cloudinary's global CDN for maximum performance
 * 
 * FREE TIER: 25GB/month bandwidth, 25K transformations
 * Perfect for Railway deployment - adds global CDN without changing deployment
 */

// Get cloud name from environment variable
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo'

interface ImageOptions {
  width?: number
  quality?: number
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png'
}

/**
 * Convert any image URL to Cloudinary CDN URL
 * Automatically optimizes format (WebP/AVIF) and size
 *
 * @param originalUrl - Original image URL (external or local)
 * @param options - Transformation options
 * @returns Cloudinary CDN URL or original URL for local images
 */
export function getCDNUrl(
  originalUrl: string,
  options: ImageOptions = {}
): string {
  // Skip if no URL provided
  if (!originalUrl) {
    return originalUrl
  }

  // Skip if already a Cloudinary URL
  if (originalUrl.includes('cloudinary.com')) {
    return originalUrl
  }

  // Skip local images (Railway will serve these directly)
  if (originalUrl.startsWith('/')) {
    return originalUrl
  }

  // Skip data URLs
  if (originalUrl.startsWith('data:')) {
    return originalUrl
  }

  // ✅ CRITICAL FIX: Skip Cloudinary if not properly configured
  // 'demo' is Cloudinary's demo account which blocks production domains with 401
  // Return original URL to use Next.js Image Optimization instead
  if (!isCloudinaryConfigured()) {
    console.warn('⚠️ Cloudinary not configured - using original image URLs')
    return originalUrl
  }

  const {
    width = 800,
    quality = 80,
    format = 'auto'
  } = options

  // Cloudinary fetch URL format:
  // https://res.cloudinary.com/{cloud_name}/image/fetch/{transformations}/{encoded_url}
  const transformations = [
    `w_${width}`,           // Resize to width
    `q_${quality}`,         // Quality (1-100)
    `f_${format}`,          // Format (auto = WebP/AVIF based on browser support)
    'c_limit',              // Don't upscale images
    'dpr_auto',             // Auto device pixel ratio (retina displays)
  ].join(',')

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/fetch/${transformations}/${encodeURIComponent(originalUrl)}`
}

/**
 * Get responsive srcset for different screen sizes
 * Generates multiple image sizes for responsive loading
 * 
 * @param originalUrl - Original image URL
 * @param quality - Image quality (default: 80)
 * @returns srcset string for responsive images
 */
export function getCDNSrcSet(originalUrl: string, quality: number = 80): string {
  if (!originalUrl || originalUrl.startsWith('/') || originalUrl.startsWith('data:')) {
    return ''
  }

  return [
    `${getCDNUrl(originalUrl, { width: 400, quality })} 400w`,
    `${getCDNUrl(originalUrl, { width: 800, quality })} 800w`,
    `${getCDNUrl(originalUrl, { width: 1200, quality })} 1200w`,
    `${getCDNUrl(originalUrl, { width: 1600, quality })} 1600w`,
  ].join(', ')
}

/**
 * Preset sizes for common use cases
 * Optimized for TravelBlogr's different image contexts
 * ✅ INCREASED quality settings for sharper images
 */
export const CDN_PRESETS: Record<string, ImageOptions> = {
  thumbnail: { width: 200, quality: 85 }, // ✅ Increased from 75 to 85
  card: { width: 800, quality: 90 },      // ✅ Increased from 80 to 90
  hero: { width: 1920, quality: 92 },     // ✅ Increased from 85 to 92
  gallery: { width: 1200, quality: 90 },  // ✅ Increased from 80 to 90
  full: { width: 1600, quality: 92 },     // ✅ Increased from 85 to 92
}

/**
 * Get CDN URL with preset configuration
 * 
 * @param originalUrl - Original image URL
 * @param preset - Preset name
 * @returns Cloudinary CDN URL with preset transformations
 */
export function getCDNUrlWithPreset(
  originalUrl: string,
  preset: keyof typeof CDN_PRESETS
): string {
  return getCDNUrl(originalUrl, CDN_PRESETS[preset])
}

/**
 * Check if Cloudinary is configured
 * @returns true if cloud name is set and not 'demo'
 */
export function isCloudinaryConfigured(): boolean {
  return CLOUDINARY_CLOUD_NAME !== 'demo' && CLOUDINARY_CLOUD_NAME.length > 0
}

/**
 * Get Cloudinary cloud name
 * @returns Current cloud name
 */
export function getCloudName(): string {
  return CLOUDINARY_CLOUD_NAME
}

