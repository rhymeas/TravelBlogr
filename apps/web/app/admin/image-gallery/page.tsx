'use client'

// Force dynamic rendering to prevent SSR issues with image loading
export const dynamic = 'force-dynamic'

/**
 * Admin Image Gallery - Endless Scroll
 * Fetch images for all locations and add them with one click
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Loader2, Plus, Check, Search, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

interface ImageResult {
  url: string
  source: string
  platform: string
  width?: number
  height?: number
  score: number
  author?: string
  title?: string
}

interface Location {
  id: string
  slug: string
  name: string
  country: string
  region?: string
}

export default function ImageGalleryPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [images, setImages] = useState<ImageResult[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [addedImages, setAddedImages] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  
  const observerTarget = useRef<HTMLDivElement>(null)

  // Fetch all locations on mount
  useEffect(() => {
    fetchLocations()
  }, [])

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && selectedLocation) {
          loadMoreImages()
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loadingMore, selectedLocation])

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations')
      const data = await response.json()
      setLocations(data.locations || [])
    } catch (error) {
      toast.error('Failed to load locations')
    }
  }

  const fetchImages = async (locationName: string, pageNum: number = 1) => {
    try {
      const response = await fetch('/api/admin/fetch-location-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationName,
          page: pageNum,
          perPage: 20
        })
      })

      const data = await response.json()
      return data.images || []
    } catch (error) {
      console.error('Error fetching images:', error)
      return []
    }
  }

  const handleLocationSelect = async (location: Location) => {
    setSelectedLocation(location)
    setImages([])
    setPage(1)
    setHasMore(true)
    setLoading(true)

    const newImages = await fetchImages(location.name, 1)
    setImages(newImages)
    setHasMore(newImages.length >= 20)
    setLoading(false)
  }

  const loadMoreImages = async () => {
    if (!selectedLocation || loadingMore) return

    setLoadingMore(true)
    const nextPage = page + 1
    const newImages = await fetchImages(selectedLocation.name, nextPage)
    
    setImages(prev => [...prev, ...newImages])
    setPage(nextPage)
    setHasMore(newImages.length >= 20)
    setLoadingMore(false)
  }

  const handleAddImage = async (image: ImageResult) => {
    if (!selectedLocation) return

    try {
      const response = await fetch('/api/admin/add-location-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationSlug: selectedLocation.slug,
          imageUrl: image.url,
          source: image.source,
          platform: image.platform
        })
      })

      if (response.ok) {
        setAddedImages(prev => new Set(prev).add(image.url))
        toast.success('Image added!')
      } else {
        toast.error('Failed to add image')
      }
    } catch (error) {
      toast.error('Error adding image')
    }
  }

  const filteredLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.country.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Sidebar - Locations */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              🖼️ Image Gallery
            </h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredLocations.map((location) => (
              <button
                key={location.id}
                onClick={() => handleLocationSelect(location)}
                className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  selectedLocation?.id === location.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                }`}
              >
                <div className="font-semibold text-gray-900">{location.name}</div>
                <div className="text-sm text-gray-500">
                  {location.region && `${location.region}, `}{location.country}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content - Image Gallery */}
        <div className="flex-1 overflow-y-auto">
          {!selectedLocation ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <Filter className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Select a location to view images</p>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900">
                  {selectedLocation.name}
                </h2>
                <p className="text-gray-600">
                  {selectedLocation.region && `${selectedLocation.region}, `}
                  {selectedLocation.country}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Click <Plus className="inline h-4 w-4" /> to add images to this location
                </p>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600">Loading images...</span>
                </div>
              )}

              {/* Image Grid */}
              {!loading && images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {images.map((image, index) => (
                    <Card
                      key={`${image.url}-${index}`}
                      className="group relative overflow-hidden hover:shadow-xl transition-all duration-300"
                    >
                      {/* Image */}
                      <div className="aspect-square bg-gray-200 relative">
                        <img
                          src={image.url}
                          alt={`${selectedLocation.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        
                        {/* Platform Badge */}
                        <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                          {image.platform}
                        </div>

                        {/* Score Badge */}
                        <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
                          {image.score}
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
                          <button
                            onClick={() => handleAddImage(image)}
                            disabled={addedImages.has(image.url)}
                            className={`
                              opacity-0 group-hover:opacity-100
                              transition-all duration-300
                              px-4 py-2 rounded-lg
                              text-white font-semibold
                              flex items-center gap-2
                              shadow-lg
                              disabled:opacity-50 disabled:cursor-not-allowed
                              ${addedImages.has(image.url)
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'
                              }
                            `}
                          >
                            {addedImages.has(image.url) ? (
                              <>
                                <Check className="h-4 w-4" />
                                Added
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4" />
                                Add
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Metadata Footer */}
                      <div className="p-2 bg-gray-50 border-t border-gray-200">
                        {/* Author */}
                        {image.author && (
                          <div className="text-xs text-gray-600 truncate">
                            👤 {image.author}
                          </div>
                        )}
                        {/* Title */}
                        {image.title && (
                          <div className="text-xs text-gray-500 truncate mt-1">
                            {image.title}
                          </div>
                        )}
                        {/* Dimensions */}
                        {image.width && image.height && (
                          <div className="text-xs text-gray-400 mt-1">
                            {image.width} × {image.height}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* No Images */}
              {!loading && images.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p>No images found for this location</p>
                </div>
              )}

              {/* Loading More Indicator */}
              {loadingMore && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600">Loading more...</span>
                </div>
              )}

              {/* Infinite Scroll Trigger */}
              <div ref={observerTarget} className="h-10" />

              {/* End of Results */}
              {!hasMore && images.length > 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No more images</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

