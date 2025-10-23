'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

// Number of locations to load per batch (infinite scroll)
const LOCATIONS_PER_PAGE = 20
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
  Users, Camera, Clock, ArrowRight, MoreVertical, Edit, Trash2
} from 'lucide-react'
import { InFeedAd } from '@/components/ads/InFeedAd'
import { generateRandomInFeedPositions } from '@/lib/utils/adHelpers'
import { useAuth } from '@/hooks/useAuth'
import { LocationEditModal } from '@/components/admin/LocationEditModal'

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
  const searchParams = useSearchParams()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [displayedCount, setDisplayedCount] = useState(LOCATIONS_PER_PAGE)
  const [isLoading, setIsLoading] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const { profile } = useAuth()
  const isAdmin = (profile as any)?.role === 'admin'

  // Filter locations based on search params
  const filteredLocations = locations.filter(location => {
    const searchQuery = searchParams.get('q')?.toLowerCase()
    const category = searchParams.get('category')
    const country = searchParams.get('country')
    const rating = searchParams.get('rating')

    // Search query filter
    if (searchQuery) {
      const matchesSearch =
        location.name.toLowerCase().includes(searchQuery) ||
        location.country.toLowerCase().includes(searchQuery) ||
        location.region.toLowerCase().includes(searchQuery) ||
        location.description.toLowerCase().includes(searchQuery)

      if (!matchesSearch) return false
    }

    // Country filter
    if (country && location.country.toLowerCase() !== country.toLowerCase()) {
      return false
    }

    // Rating filter
    if (rating && location.rating) {
      const minRating = parseFloat(rating)
      if (location.rating < minRating) return false
    }

    return true
  })

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(LOCATIONS_PER_PAGE)
  }, [searchParams])

  // Infinite scroll: Load more when user scrolls near bottom
  useEffect(() => {
    if (!loadMoreRef.current) return
    if (displayedCount >= filteredLocations.length) return // All loaded

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          setIsLoading(true)
          // Simulate loading delay for smooth UX
          setTimeout(() => {
            setDisplayedCount(prev => Math.min(prev + LOCATIONS_PER_PAGE, filteredLocations.length))
            setIsLoading(false)
          }, 300)
        }
      },
      { threshold: 0.1, rootMargin: '200px' } // Start loading 200px before reaching bottom
    )

    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [displayedCount, filteredLocations.length, isLoading])

  // Get currently displayed locations
  const displayedLocations = filteredLocations.slice(0, displayedCount)
  const hasMore = displayedCount < filteredLocations.length

  // Randomized in-feed ad positions (stable per day)
  const [adPositions, setAdPositions] = useState<Set<number>>(new Set())
  useEffect(() => {
    const daySeed = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    const seed = `locations:${filteredLocations[0]?.id || 'seed'}:${daySeed}`
    setAdPositions(generateRandomInFeedPositions(displayedCount, seed, 4, 7))
  }, [displayedCount, filteredLocations.length])

  if (!filteredLocations.length) {
    return (
      <div className="text-center py-12">
        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
        <p className="text-gray-600">Try adjusting your search filters or explore featured destinations.</p>
      </div>
    )
  }

  const handleUpdate = () => {
    setRefreshKey(prev => prev + 1)
    // Trigger parent refresh if needed
  }

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {displayedCount} of {filteredLocations.length} location{filteredLocations.length !== 1 ? 's' : ''}
          {filteredLocations.length !== locations.length && (
            <span className="text-gray-400"> (filtered from {locations.length} total)</span>
          )}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayedLocations.map((location, index) => (
            <>
              <LocationCard
                key={`${location.id}-${refreshKey}`}
                location={location}
                priority={index < 8}
                isAdmin={isAdmin}
                onEdit={() => setEditingLocation(location)}
              />
              {/* In-feed ad randomized between cards (min gap 4–7) */}
              {adPositions.has(index) && (
                <InFeedAd
                  key={`ad-${index}`}
                  slot={process.env.NEXT_PUBLIC_ADS_SLOT_LOCATIONS_INFEED || 'locations_infeed'}
                  page="locations"
                />
              )}
            </>
          ))}
        </div>
      )}

      {/* List View - 2 Column Layout */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {displayedLocations.map((location, index) => (
            <LocationListItem
              key={`${location.id}-${refreshKey}`}
              location={location}
              priority={index < 6}
              isAdmin={isAdmin}
              onEdit={() => setEditingLocation(location)}
            />
          ))}
        </div>
      )}

      {/* Infinite Scroll Trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="py-8 text-center">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-rausch-500"></div>
              <span>Loading more locations...</span>
            </div>
          ) : (
            <div className="text-gray-400 text-sm">Scroll for more</div>
          )}
        </div>
      )}

      {/* All Loaded Message */}
      {!hasMore && displayedCount > LOCATIONS_PER_PAGE && (
        <div className="py-8 text-center text-gray-500 text-sm">
          ✨ You've seen all {locations.length} locations!
        </div>
      )}

      {/* Admin Edit Modal */}
      {editingLocation && (
        <LocationEditModal
          isOpen={true}
          onClose={() => setEditingLocation(null)}
          location={editingLocation}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}

function LocationCard({
  location,
  priority = false,
  isAdmin = false,
  onEdit
}: {
  location: Location
  priority?: boolean
  isAdmin?: boolean
  onEdit?: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)
  const latestPost = location.location_posts?.[0]
  const formatted = formatLocationName(location.name)

  return (
    <div className="group block relative">
      <Link href={`/locations/${location.slug}`}>
        <div className="card-elevated hover:shadow-sleek-large transition-all duration-300 overflow-hidden">
          {/* Featured Image */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <OptimizedImage
              src={location.featured_image || '/placeholder-location.jpg'}
              alt={location.name}
              fill
              preset="card"
              priority={priority}
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />

            {/* Heart Button */}
            <button
              className="absolute top-3 left-3 w-8 h-8 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center text-sleek-dark-gray hover:text-rausch-500 transition-colors shadow-sleek-light"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                // Handle favorite toggle
              }}
            >
              <Heart className="h-4 w-4" />
            </button>

            {/* Admin Three-Dots Menu */}
            {isAdmin && (
              <div className="absolute top-3 right-3">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowMenu(!showMenu)
                  }}
                  className="w-8 h-8 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 hover:bg-white transition-colors shadow-lg"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setShowMenu(false)
                      }}
                    />
                    <div className="absolute right-0 top-10 w-40 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setShowMenu(false)
                          onEdit?.()
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Location
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Rating Badge */}
            {!isAdmin && (
              <div className="absolute top-3 right-3">
                <div className="bg-white/95 backdrop-blur-sm rounded-sleek-small px-3 py-1 text-body-small font-semibold text-sleek-black shadow-sleek-light">
                  {location.rating ? `★ ${location.rating}` : 'New'}
                </div>
              </div>
            )}

          {/* Stats Overlay */}
          <div className="absolute bottom-3 right-3 flex gap-2">
            <div className="bg-black/70 backdrop-blur-sm text-white text-body-small px-2 py-1 rounded-sleek-small flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {location.visit_count}
            </div>
            <div className="bg-black/70 backdrop-blur-sm text-white text-body-small px-2 py-1 rounded-sleek-small flex items-center gap-1">
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
            <h3 className="text-title-small text-sleek-black font-semibold mb-1 group-hover:text-rausch-500 transition-colors">
              {formatted.short}
            </h3>
            <div className="flex items-center gap-1 text-body-medium text-sleek-dark-gray">
              <MapPin className="h-4 w-4" />
              <span>
                {formatted.region && `${formatted.region}, `}{formatted.country || location.country}
              </span>
            </div>
          </div>

          <p className="text-body-medium text-sleek-dark-gray line-clamp-2 mb-4">
            {location.description}
          </p>

          {/* Latest Post Preview */}
          {latestPost && (
            <div className="mt-3 p-3 bg-gray-50 rounded-sleek-small">
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
    </div>
  )
}

function LocationListItem({
  location,
  priority = false,
  isAdmin = false,
  onEdit
}: {
  location: Location
  priority?: boolean
  isAdmin?: boolean
  onEdit?: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)
  const latestPost = location.location_posts?.[0]
  const formatted = formatLocationName(location.name)

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 relative">
      <div className="flex">
        {/* Image - Reduced from w-48 to w-32 */}
        <div className="relative w-32 h-24 flex-shrink-0">
          <OptimizedImage
            src={location.featured_image || '/placeholder-location.jpg'}
            alt={location.name}
            fill
            preset="thumbnail"
            priority={priority}
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
              {!isAdmin && location.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{location.rating}</span>
                </div>
              )}
              {!isAdmin && (
                <>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{location.visit_count}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Camera className="h-3 w-3" />
                    <span>{location.gallery_images?.length || 0}</span>
                  </div>
                </>
              )}

              {/* Admin Menu */}
              {isAdmin && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowMenu(!showMenu)
                    }}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {showMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowMenu(false)}
                      />
                      <div className="absolute right-0 top-8 w-40 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setShowMenu(false)
                            onEdit?.()
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Location
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
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
