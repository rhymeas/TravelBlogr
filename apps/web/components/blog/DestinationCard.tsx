'use client'

/**
 * DestinationCard - Blog Destination Card Component
 * 
 * A card component for displaying popular destinations in blog pages.
 * Follows existing TravelBlogr design patterns with image, title, description, and stats.
 * 
 * Use cases:
 * - Popular destinations section on blog homepage
 * - Related destinations in blog posts
 * - Destination grid on location pages
 */

import { MapPin, TrendingUp, Eye, Heart } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { Badge } from '@/components/ui/Badge'

export interface DestinationCardData {
  id: string
  name: string
  country: string
  countryFlag?: string
  image: string
  description?: string
  stats?: {
    views?: number
    likes?: number
    trips?: number
  }
  tags?: string[]
  isTrending?: boolean
  href?: string
}

interface DestinationCardProps {
  destination: DestinationCardData
  variant?: 'default' | 'compact' | 'featured'
  onClick?: (destination: DestinationCardData) => void
  className?: string
}

export function DestinationCard({
  destination,
  variant = 'default',
  onClick,
  className = ''
}: DestinationCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(destination)
    } else if (destination.href) {
      window.location.href = destination.href
    }
  }

  // Variant-specific dimensions
  const heights = {
    compact: 'h-48',
    default: 'h-64',
    featured: 'h-80'
  }

  const imageHeights = {
    compact: 'h-32',
    default: 'h-40',
    featured: 'h-56'
  }

  return (
    <Card
      className={`group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer ${heights[variant]} flex flex-col ${className}`}
      onClick={handleClick}
    >
      {/* Image */}
      <div className={`relative ${imageHeights[variant]} overflow-hidden bg-gray-200`}>
        <OptimizedImage
          src={destination.image}
          alt={destination.name}
          fill
          preset="thumbnail"
          className="object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          {destination.isTrending && (
            <Badge className="bg-rausch-500 text-white border-0 shadow-lg">
              <TrendingUp className="h-3 w-3 mr-1" />
              Trending
            </Badge>
          )}
          {destination.countryFlag && (
            <div className="text-2xl">{destination.countryFlag}</div>
          )}
        </div>

        {/* Bottom Location Name (on image) */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-semibold text-lg line-clamp-1 leading-tight">
            {destination.name}
          </h3>
          <div className="flex items-center gap-1 text-white/90 text-sm mt-1">
            <MapPin className="h-3 w-3" />
            <span className="line-clamp-1">{destination.country}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        {/* Description */}
        {destination.description && variant !== 'compact' && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {destination.description}
          </p>
        )}

        {/* Tags */}
        {destination.tags && destination.tags.length > 0 && variant === 'featured' && (
          <div className="flex flex-wrap gap-2 mb-3">
            {destination.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Stats */}
        {destination.stats && (
          <div className="flex items-center gap-4 text-gray-500 text-xs mt-auto">
            {destination.stats.views !== undefined && (
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{formatNumber(destination.stats.views)}</span>
              </div>
            )}
            {destination.stats.likes !== undefined && (
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                <span>{formatNumber(destination.stats.likes)}</span>
              </div>
            )}
            {destination.stats.trips !== undefined && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{formatNumber(destination.stats.trips)} trips</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

// Helper function to format numbers
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

/**
 * DestinationCardSkeleton - Loading state for DestinationCard
 */
export function DestinationCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'compact' | 'featured' }) {
  const heights = {
    compact: 'h-48',
    default: 'h-64',
    featured: 'h-80'
  }

  const imageHeights = {
    compact: 'h-32',
    default: 'h-40',
    featured: 'h-56'
  }

  return (
    <Card className={`overflow-hidden ${heights[variant]} flex flex-col animate-pulse`}>
      <div className={`${imageHeights[variant]} bg-gray-200`} />
      <div className="p-4 flex-1">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
        {variant !== 'compact' && (
          <>
            <div className="h-3 bg-gray-200 rounded w-full mb-2" />
            <div className="h-3 bg-gray-200 rounded w-5/6" />
          </>
        )}
      </div>
    </Card>
  )
}

