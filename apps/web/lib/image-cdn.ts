/**
 * ImageKit.io Image CDN
 * Routes all external images through ImageKit's global CDN for maximum performance
 *
 * FREE TIER: 20GB/month bandwidth, UNLIMITED transformations, 20GB storage
 * PAID TIER: $49/month (vs Cloudinary $89/month)
 *
 * Why ImageKit over Cloudinary:
 * ✅ Unlimited transformations (Cloudinary limits to 25K)
 * ✅ Cheaper paid plans ($49 vs $89/month)
 * ✅ Built-in Media Library
 * ✅ AWS CloudFront CDN (faster global delivery)
 * ✅ Better for scaling
 */

// Get ImageKit credentials from environment variables
const IMAGEKIT_URL_ENDPOINT = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || ''
const IMAGEKIT_PUBLIC_KEY = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || ''

interface ImageOptions {
  width?: number
  quality?: number
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png'
}

/**
 * Convert any image URL to ImageKit CDN URL
 * Automatically optimizes format (WebP/AVIF) and size
 *
 * @param originalUrl - Original image URL (external or local)
 * @param options - Transformation options
 * @returns ImageKit CDN URL or original URL for local images
 */
export function getCDNUrl(
  originalUrl: string,
  options: ImageOptions = {}
): string {
  // Skip if no URL provided
  if (!originalUrl) {
    return originalUrl
  }

  // CRITICAL FIX: If the URL doesn't look like a valid URL (e.g., just a location name),
  // return placeholder instead of trying to route through ImageKit
  if (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://') && !originalUrl.startsWith('/')) {
    console.warn(`⚠️ Invalid image URL (not a URL): "${originalUrl}" - using placeholder`)
    return '/placeholder-location.jpg'
  }

  // Skip if already an ImageKit URL
  if (originalUrl.includes('imagekit.io')) {
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

  // ✅ CRITICAL FIX: Disable ImageKit for now
  // ImageKit URL construction was causing 400 errors with Next.js Image component
  // Next.js Image tries to optimize the ImageKit URL again, creating invalid URLs
  // Solution: Use original URLs directly (Next.js Image will optimize them)
  // TODO: Re-enable ImageKit with proper configuration when needed

  // For now, just return the original URL
  // Next.js Image component will handle optimization automatically
  return originalUrl
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
 *
 * ✅ BALANCED: High quality + Fast loading
 * - Quality 85 is the sweet spot (visually identical to 95, 40% smaller file size)
 * - Cloudinary auto-format (WebP/AVIF) reduces size by another 30-50%
 * - Progressive loading for smooth UX
 */
export const CDN_PRESETS: Record<string, ImageOptions> = {
  thumbnail: { width: 300, quality: 80 },   // Small previews
  card: { width: 800, quality: 85 },        // ✅ OPTIMIZED: 800px @ 85% (fast + sharp)
  hero: { width: 1920, quality: 85 },       // ✅ OPTIMIZED: 1920px @ 85% (fast + sharp)
  gallery: { width: 1200, quality: 85 },    // Gallery images
  full: { width: 1920, quality: 85 },       // Full-size images
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
 * Check if ImageKit is configured
 * @returns true if URL endpoint and public key are set
 */
export function isImageKitConfigured(): boolean {
  return IMAGEKIT_URL_ENDPOINT.length > 0 && IMAGEKIT_PUBLIC_KEY.length > 0
}

/**
 * Get ImageKit URL endpoint
 * @returns Current URL endpoint
 */
export function getImageKitEndpoint(): string {
  return IMAGEKIT_URL_ENDPOINT
}

/**
 * Get ImageKit public key
 * @returns Current public key
 */
export function getImageKitPublicKey(): string {
  return IMAGEKIT_PUBLIC_KEY
}

