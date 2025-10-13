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
  const [isExpanded, setIsExpanded] = useState(false)

  // Don't show if no attribution data
  if (!source && !photographer && !platform) {
    return null
  }

  // Extract photographer from Unsplash URL if available
  const getPhotographerFromUrl = (url?: string) => {
    if (!url) return null
    if (url.includes('unsplash.com')) {
      const match = url.match(/unsplash\.com\/photos\/[^/]+\?utm_source=/)
      if (match) {
        const parts = url.split('/')
        const photoIndex = parts.indexOf('photos')
        if (photoIndex > 0 && parts[photoIndex - 1]) {
          return parts[photoIndex - 1].replace('@', '')
        }
      }
    }
    return null
  }

  const displayPhotographer = photographer || getPhotographerFromUrl(sourceUrl)
  const displayPlatform = platform || (sourceUrl?.includes('unsplash') ? 'Unsplash' : 
                                       sourceUrl?.includes('pexels') ? 'Pexels' :
                                       sourceUrl?.includes('pixabay') ? 'Pixabay' :
                                       sourceUrl?.includes('wikimedia') ? 'Wikimedia' :
                                       sourceUrl?.includes('wikipedia') ? 'Wikipedia' : 
                                       'Unknown')

  return (
    <div className={`absolute bottom-2 right-2 z-10 ${className}`}>
      {isExpanded ? (
        // Expanded view with details
        <a
          href={sourceUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-black/70 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded hover:bg-black/80 transition-colors group"
          onClick={(e) => {
            if (!sourceUrl) {
              e.preventDefault()
              setIsExpanded(false)
            }
          }}
        >
          <Info className="h-2.5 w-2.5 flex-shrink-0" />
          <span className="max-w-[120px] truncate">
            {displayPhotographer ? `${displayPhotographer} / ` : ''}{displayPlatform}
          </span>
          {sourceUrl && <ExternalLink className="h-2.5 w-2.5 flex-shrink-0 opacity-70 group-hover:opacity-100" />}
        </a>
      ) : (
        // Collapsed view - just icon
        <button
          onClick={() => setIsExpanded(true)}
          className="w-5 h-5 bg-black/50 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
          title="Image attribution"
        >
          <Info className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

// Helper to extract attribution from image URL
export function getImageAttribution(imageUrl?: string): Partial<ImageAttributionProps> {
  if (!imageUrl) return {}

  // Unsplash
  if (imageUrl.includes('unsplash.com')) {
    const photographerMatch = imageUrl.match(/photo-(\d+)-([^?]+)/)
    return {
      platform: 'Unsplash',
      sourceUrl: imageUrl,
      photographer: photographerMatch?.[2]?.replace(/-/g, ' ')
    }
  }

  // Pexels
  if (imageUrl.includes('pexels.com')) {
    return {
      platform: 'Pexels',
      sourceUrl: imageUrl
    }
  }

  // Pixabay
  if (imageUrl.includes('pixabay.com')) {
    return {
      platform: 'Pixabay',
      sourceUrl: imageUrl
    }
  }

  // Wikimedia
  if (imageUrl.includes('wikimedia.org')) {
    return {
      platform: 'Wikimedia',
      sourceUrl: imageUrl
    }
  }

  // Wikipedia
  if (imageUrl.includes('wikipedia.org')) {
    return {
      platform: 'Wikipedia',
      sourceUrl: imageUrl
    }
  }

  return {}
}

