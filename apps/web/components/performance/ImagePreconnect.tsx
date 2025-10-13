/**
 * Image Preconnect Component
 * 
 * Establishes early connections to image CDNs/domains to reduce latency.
 * Should be placed in root layout for maximum benefit.
 * 
 * Performance Impact:
 * - Saves 100-300ms per image domain (DNS + TLS handshake)
 * - Critical for external images (Pexels, Unsplash, Wikimedia, etc.)
 */

export function ImagePreconnect() {
  // List of image domains used in TravelBlogr
  const imageDomains = [
    'res.cloudinary.com', // Cloudinary CDN - HIGHEST PRIORITY (routes all external images)
    'images.pexels.com',
    'images.unsplash.com',
    'plus.unsplash.com',
    'upload.wikimedia.org',
    'live.staticflickr.com',
    'api.europeana.eu',
    'images.metmuseum.org',
    'nchhcxokrzabbkvhzsor.supabase.co', // Supabase storage
  ]

  return (
    <>
      {imageDomains.map((domain) => (
        <link
          key={domain}
          rel="preconnect"
          href={`https://${domain}`}
          crossOrigin="anonymous"
        />
      ))}
      
      {/* DNS prefetch as fallback for older browsers */}
      {imageDomains.map((domain) => (
        <link
          key={`dns-${domain}`}
          rel="dns-prefetch"
          href={`https://${domain}`}
        />
      ))}
    </>
  )
}

