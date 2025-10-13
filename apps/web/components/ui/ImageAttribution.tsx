'use client'

import { useState } from 'react'
import { Info, ExternalLink } from 'lucide-react'

interface ImageAttributionProps {
  source?: string
  photographer?: string
  platform?: 'Unsplash' | 'Pexels' | 'Pixabay' | 'Wikimedia' | 'Wikipedia' | 'Openverse' | 'Flickr'
  sourceUrl?: string
  className?: string
}

export function ImageAttribution({
  source,
  photographer,
  platform,
  sourceUrl,
  className = ''
}: ImageAttributionProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Don't show if no attribution data
  if (!source && !photographer && !platform && !sourceUrl) {
    return null
  }

  // Extract photographer from Unsplash URL if available
  const getPhotographerFromUrl = (url?: string) => {
    if (!url) return null

    // Unsplash: Extract from URL path
    if (url.includes('unsplash.com')) {
      // Try to get from photo URL: unsplash.com/photos/abc123?utm_source=...
      const match = url.match(/unsplash\.com\/photos\/([^/?]+)/)
      if (match) {
        // Try to extract photographer from URL params
        const urlObj = new URL(url)
        const utmSource = urlObj.searchParams.get('utm_source')
        if (utmSource) return utmSource
      }
      // Try to get from @username format
      const userMatch = url.match(/@([^/]+)/)
      if (userMatch) return userMatch[1]
    }

    // Pexels: Extract photographer from URL
    if (url.includes('pexels.com')) {
      const match = url.match(/pexels\.com\/photo\/[^/]+-by-([^-]+)-/)
      if (match) return match[1].replace(/-/g, ' ')
    }

    return null
  }

  const displayPhotographer = photographer || getPhotographerFromUrl(sourceUrl)
  const displayPlatform = platform || (sourceUrl?.includes('unsplash') ? 'Unsplash' :
                                       sourceUrl?.includes('pexels') ? 'Pexels' :
                                       sourceUrl?.includes('pixabay') ? 'Pixabay' :
                                       sourceUrl?.includes('wikimedia') ? 'Wikimedia' :
                                       sourceUrl?.includes('wikipedia') ? 'Wikipedia' :
                                       sourceUrl?.includes('openverse') ? 'Openverse' :
                                       sourceUrl?.includes('flickr') ? 'Flickr' :
                                       'Unknown')

  return (
    <div
      className={`absolute bottom-2 right-2 z-10 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered ? (
        // Expanded view with details (on hover)
        <a
          href={sourceUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-black/80 backdrop-blur-sm text-white text-[11px] px-2.5 py-1.5 rounded-md hover:bg-black/90 transition-colors group shadow-lg"
          onClick={(e) => {
            e.stopPropagation() // Prevent opening image/lightbox
            if (!sourceUrl) {
              e.preventDefault()
            }
          }}
        >
          <Info className="h-3 w-3 flex-shrink-0" />
          <span className="max-w-[150px] truncate font-medium">
            {displayPhotographer ? (
              <>
                <span className="text-white">{displayPhotographer}</span>
                <span className="text-white/60 mx-1">•</span>
                <span className="text-white/80">{displayPlatform}</span>
              </>
            ) : (
              <span className="text-white/80">{displayPlatform}</span>
            )}
          </span>
          {sourceUrl && <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-70 group-hover:opacity-100" />}
        </a>
      ) : (
        // Collapsed view - just icon
        <div
          className="w-7 h-7 bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors shadow-lg cursor-pointer"
          title="Image attribution"
          onClick={(e) => e.stopPropagation()} // Prevent opening image/lightbox
        >
          <Info className="h-4 w-4" />
        </div>
      )}
    </div>
  )
}

// Helper to extract attribution from image URL
export function getImageAttribution(imageUrl?: string): Partial<ImageAttributionProps> {
  if (!imageUrl) return {}

  // Unsplash - Extract photographer and create proper source URL
  if (imageUrl.includes('unsplash.com')) {
    // Try to extract photo ID from URL
    const photoIdMatch = imageUrl.match(/photo-([a-zA-Z0-9_-]+)/)
    const photoId = photoIdMatch?.[1]

    // Try to extract photographer username from URL
    let photographer = undefined
    const userMatch = imageUrl.match(/@([^/]+)/)
    if (userMatch) {
      photographer = userMatch[1]
    }

    // Create proper Unsplash photo URL
    const sourceUrl = photoId
      ? `https://unsplash.com/photos/${photoId}`
      : imageUrl

    return {
      platform: 'Unsplash',
      sourceUrl,
      photographer
    }
  }

  // Pexels - Extract photographer from URL if possible
  if (imageUrl.includes('pexels.com')) {
    // Pexels URLs often contain photographer name
    const photographerMatch = imageUrl.match(/pexels\.com\/photo\/[^/]+-by-([^-]+)-/)
    const photographer = photographerMatch?.[1]?.replace(/-/g, ' ')

    return {
      platform: 'Pexels',
      sourceUrl: imageUrl,
      photographer
    }
  }

  // Pixabay
  if (imageUrl.includes('pixabay.com')) {
    return {
      platform: 'Pixabay',
      sourceUrl: imageUrl
    }
  }

  // Wikimedia Commons
  if (imageUrl.includes('wikimedia.org')) {
    // Try to create proper Wikimedia Commons URL
    const fileMatch = imageUrl.match(/\/([^/]+\.(jpg|jpeg|png|gif|svg))/)
    const fileName = fileMatch?.[1]
    const sourceUrl = fileName
      ? `https://commons.wikimedia.org/wiki/File:${fileName}`
      : imageUrl

    return {
      platform: 'Wikimedia',
      sourceUrl
    }
  }

  // Wikipedia
  if (imageUrl.includes('wikipedia.org')) {
    return {
      platform: 'Wikipedia',
      sourceUrl: imageUrl
    }
  }

  // Openverse
  if (imageUrl.includes('openverse.org')) {
    return {
      platform: 'Openverse',
      sourceUrl: imageUrl
    }
  }

  // Flickr
  if (imageUrl.includes('flickr.com') || imageUrl.includes('staticflickr.com')) {
    return {
      platform: 'Flickr',
      sourceUrl: imageUrl
    }
  }

  // If we have a URL but can't identify the platform, still show attribution
  if (imageUrl.startsWith('http')) {
    return {
      sourceUrl: imageUrl
    }
  }

  return {}
}

