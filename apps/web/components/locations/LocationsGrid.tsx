'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { ImageAttribution, getImageAttribution } from '@/components/ui/ImageAttribution'
import { formatLocationName } from '@/lib/utils/locationFormatter'
import {
  MapPin, Star, Eye, Heart, Calendar,
  Users, Camera, Clock, ArrowRight
} from 'lucide-react'

interface Location {
  id: string
  name: string
  slug: string
  country: string
  region: string
  description: string
  featured_image?: string
  gallery_images?: string[]
  rating?: number
  visit_count: number
  is_featured: boolean
  location_posts?: Array<{
    id: string
    title: string
    excerpt: string
    featured_image: string
    published_at: string
    view_count: number
    like_count: number
    author: {
      id: string
      name: string
      avatar_url: string
    }
  }>
}

interface LocationsGridProps {
  locations: Location[]
}

export function LocationsGrid({ locations }: LocationsGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  if (!locations.length) {
    return (
      <div className="text-center py-12">
        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
        <p className="text-gray-600">Try adjusting your search filters or explore featured destinations.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {locations.length} location{locations.length !== 1 ? 's' : ''}
        </p>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            Grid
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((location) => (
            <LocationCard key={location.id} location={location} />
          ))}
        </div>
      )}

      {/* List View - 2 Column Layout */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {locations.map((location) => (
            <LocationListItem key={location.id} location={location} />
          ))}
        </div>
      )}
    </div>
  )
}

function LocationCard({ location }: { location: Location }) {
  const latestPost = location.location_posts?.[0]
  const formatted = formatLocationName(location.name)

  return (
    <Link href={`/locations/${location.slug}`} className="group block">
      <div className="card-elevated hover:shadow-airbnb-large transition-all duration-300 overflow-hidden">
        {/* Featured Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <OptimizedImage
            src={location.featured_image || '/placeholder-location.jpg'}
            alt={location.name}
            fill
            preset="card"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Heart Button */}
          <button
            className="absolute top-3 left-3 w-8 h-8 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center text-airbnb-dark-gray hover:text-rausch-500 transition-colors shadow-airbnb-light"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              // Handle favorite toggle
            }}
          >
            <Heart className="h-4 w-4" />
          </button>

          {/* Rating Badge */}
          <div className="absolute top-3 right-3">
            <div className="bg-white/95 backdrop-blur-sm rounded-airbnb-small px-3 py-1 text-body-small font-semibold text-airbnb-black shadow-airbnb-light">
              {location.rating ? `★ ${location.rating}` : 'New'}
            </div>
          </div>

          {/* Stats Overlay */}
          <div className="absolute bottom-3 right-3 flex gap-2">
            <div className="bg-black/70 backdrop-blur-sm text-white text-body-small px-2 py-1 rounded-airbnb-small flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {location.visit_count}
            </div>
            <div className="bg-black/70 backdrop-blur-sm text-white text-body-small px-2 py-1 rounded-airbnb-small flex items-center gap-1">
              <Camera className="h-3 w-3" />
              {location.gallery_images?.length || 0}
            </div>
          </div>

          {/* Image Attribution */}
          <ImageAttribution {...getImageAttribution(location.featured_image)} />
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-title-small text-airbnb-black font-semibold mb-1 group-hover:text-rausch-500 transition-colors">
              {formatted.short}
            </h3>
            <div className="flex items-center gap-1 text-body-medium text-airbnb-dark-gray">
              <MapPin className="h-4 w-4" />
              <span>
                {formatted.region && `${formatted.region}, `}{formatted.country || location.country}
              </span>
            </div>
          </div>

          <p className="text-body-medium text-airbnb-dark-gray line-clamp-2 mb-4">
            {location.description}
          </p>

          {/* Latest Post Preview */}
          {latestPost && (
            <div className="mt-3 p-3 bg-gray-50 rounded-airbnb-small">
              <div className="flex items-center gap-2 mb-2">
                <Image
                  src={latestPost.author.avatar_url || '/default-avatar.png'}
                  alt={latestPost.author.name}
                  width={20}
                  height={20}
                  className="rounded-full"
                />
                <span className="text-xs text-gray-600">{latestPost.author.name}</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-400">
                  {new Date(latestPost.published_at).toLocaleDateString()}
                </span>
              </div>
              <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
                {latestPost.title}
              </h4>
              <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                {latestPost.excerpt}
              </p>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-4">
            <Button className="w-full group-hover:bg-rausch-500 transition-colors">
              Explore Location
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  )
}

function LocationListItem({ location }: { location: Location }) {
  const latestPost = location.location_posts?.[0]
  const formatted = formatLocationName(location.name)

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <div className="flex">
        {/* Image - Reduced from w-48 to w-32 */}
        <div className="relative w-32 h-24 flex-shrink-0">
          <OptimizedImage
            src={location.featured_image || '/placeholder-location.jpg'}
            alt={location.name}
            fill
            preset="thumbnail"
            className="object-cover rounded-l-lg"
          />

          {location.is_featured && (
            <Badge className="absolute top-2 left-2 bg-yellow-100 text-yellow-800 text-xs">
              Featured
            </Badge>
          )}

          {/* Image Attribution */}
          <ImageAttribution {...getImageAttribution(location.featured_image)} />
        </div>

        {/* Content - Reduced padding */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate">
                <Link href={`/locations/${location.slug}`}>
                  {formatted.short}
                </Link>
              </h3>
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <MapPin className="h-3 w-3" />
                <span className="truncate">
                  {formatted.region && `${formatted.region}, `}{formatted.country || location.country}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 ml-2">
              {location.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{location.rating}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{location.visit_count}</span>
              </div>
              <div className="flex items-center gap-1">
                <Camera className="h-3 w-3" />
                <span>{location.gallery_images?.length || 0}</span>
              </div>
            </div>
          </div>

          <p className="text-gray-600 text-sm line-clamp-2 mb-2">
            {location.description}
          </p>

          {/* Latest Post - Compact */}
          {latestPost && (
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
              <Image
                src={latestPost.author.avatar_url || '/default-avatar.png'}
                alt={latestPost.author.name}
                width={24}
                height={24}
                className="rounded-full"
              />
              <div className="flex-1 min-w-0">
                <span className="text-gray-900 font-medium truncate block">
                  {latestPost.title}
                </span>
              </div>
              <div className="flex items-center gap-1 text-gray-500">
                <Heart className="h-3 w-3" />
                <span>{latestPost.like_count}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
