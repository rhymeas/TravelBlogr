"use client"
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
  fallbackSrc?: string
}

// Heuristic to avoid passing non-image page URLs (e.g., expedia.com/...)
function isLikelyImageUrl(url: string): boolean {
  try {
    if (!url) return false
    if (url.startsWith('/')) return true

    const u = new URL(url)
    const host = u.hostname.toLowerCase()
    const pathname = u.pathname.toLowerCase()

    // Allow common image extensions
    const hasExt = /(\.jpg|\.jpeg|\.png|\.webp|\.gif|\.avif|\.svg)$/i.test(pathname)

    // Known image/CDN hosts that may omit extensions (Unsplash, Brave thumbnails, etc.)
    const ALLOWED_HOSTS = [
      'lh3.googleusercontent.com',
      'ik.imagekit.io',
      'res.cloudinary.com',
      'images.unsplash.com',
      'plus.unsplash.com',
      'source.unsplash.com',
      'picsum.photos',
      'upload.wikimedia.org',
      'wikimedia.org',
      'images.rawpixel.com',
      'images.pexels.com',
      'live.staticflickr.com',
      'flickr.com',
      'staticflickr.com',
      'i.redd.it',
      'preview.redd.it',
      'external-preview.redd.it',
      'imgs.search.brave.com',
      'i.imgur.com',
      'ppcdn.500px.org',
      'pd.w.org',
      'w.org',
      'supabase.co',
    ]

    const isAllowedHost = ALLOWED_HOSTS.some(h => host === h || host.endsWith('.' + h))

    // Explicitly disallow known non-image content hosts often used as page links
    const DISALLOW_HOSTS = [
      'www.expedia.com', 'expedia.com',
      'www.booking.com', 'booking.com',
      'www.tripadvisor.com', 'tripadvisor.com',
      'www.lonelyplanet.com', 'lonelyplanet.com',
      'www.viator.com', 'viator.com',
      'www.getyourguide.com', 'getyourguide.com',
      'www.airbnb.com', 'airbnb.com',
      'www.kayak.com', 'kayak.com'
    ]
    const isDisallowed = DISALLOW_HOSTS.includes(host)

    return (hasExt || isAllowedHost) && !isDisallowed
  } catch {
    return false
  }
}

/**
 * SmartImage component that automatically detects SVG files
 * and routes external images through ImageKit CDN for optimization
 */
export function SmartImage({ src, alt, fallbackSrc = '/placeholder-location.jpg', ...props }: SmartImageProps) {
  // Allow onError from clients, but this is a Client Component, so safe
  const { onError: onErrorProp, ...restProps } = props as Record<string, any>

  const safeSrc = isLikelyImageUrl(src) ? src : fallbackSrc

  // Check if the image is an SVG
  const isSVG = safeSrc.endsWith('.svg')

  // ✅ For SVG files, use unoptimized mode
  if (isSVG) {
    return (
      <Image
        src={safeSrc}
        alt={alt}
        unoptimized
        {...(restProps as any)}
      />
    )
  }

  // ✅ For local images, use Next.js Image optimization directly
  if (safeSrc.startsWith('/')) {
    return (
      <Image
        src={safeSrc}
        alt={alt}
        {...(restProps as any)}
      />
    )
  }

  // ✅ For external images:
  // If ImageKit is configured, use it directly (unoptimized to avoid double-encoding)
  if (isImageKitConfigured()) {
    const cdnSrc = getCDNUrl(safeSrc)
    return (
      <Image
        src={cdnSrc}
        alt={alt}
        unoptimized
        {...(restProps as any)}
      />
    )
  }

  // ⚠️ ImageKit disabled: Next/Image would crash on unknown hosts.
  // Use native <img> to avoid Next host whitelist crashes for arbitrary sources.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={safeSrc}
      alt={alt}
      className={props.className}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      onError={(e) => {
        try { if (typeof onErrorProp === 'function') onErrorProp(e) } catch {}
        const target = e.currentTarget as HTMLImageElement
        if (target.src !== fallbackSrc) target.src = fallbackSrc
      }}
    />
  )
}

