'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { getBrowserSupabase } from '@/lib/supabase'
import { Search, MapPin, Star, Eye, Plus, Loader2 } from 'lucide-react'

interface Location {
  id: string
  name: string
  slug: string
  description: string
  country: string
  region: string
  city: string
  featured_image?: string
  rating?: number
  visit_count: number
  is_featured: boolean
}

interface LocationBrowserProps {
  onSelectLocation: (location: Location) => void
  selectedLocationId?: string
}

export function LocationBrowser({ onSelectLocation, selectedLocationId }: LocationBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'featured' | 'popular'>('all')

  // Load initial locations
  useEffect(() => {
    loadLocations()
  }, [filter])

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchLocations()
      } else if (searchQuery.length === 0) {
        loadLocations()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const loadLocations = async () => {
    setLoading(true)
    const supabase = getBrowserSupabase()

    let query = supabase
      .from('locations')
      .select('*')
      .eq('is_published', true)
      .limit(20)

    if (filter === 'featured') {
      query = query.eq('is_featured', true)
    } else if (filter === 'popular') {
      query = query.order('visit_count', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query

    if (!error && data) {
      setLocations(data)
    }
    setLoading(false)
  }

  const searchLocations = async () => {
    setLoading(true)
    const supabase = getBrowserSupabase()

    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('is_published', true)
      .or(`name.ilike.%${searchQuery}%,country.ilike.%${searchQuery}%,region.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`)
      .limit(20)

    if (!error && data) {
      setLocations(data)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search locations by name, city, or country..."
          className="pl-10"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All Locations
        </Button>
        <Button
          variant={filter === 'featured' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('featured')}
        >
          Featured
        </Button>
        <Button
          variant={filter === 'popular' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('popular')}
        >
          Popular
        </Button>
      </div>

      {/* Results */}
      <div className="max-h-96 overflow-y-auto space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-rausch-500" />
          </div>
        ) : locations.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {searchQuery ? 'No locations found' : 'No locations available'}
            </p>
          </div>
        ) : (
          locations.map((location) => (
            <LocationBrowserCard
              key={location.id}
              location={location}
              onSelect={() => onSelectLocation(location)}
              isSelected={location.id === selectedLocationId}
            />
          ))
        )}
      </div>

      {/* Results Count */}
      {!loading && locations.length > 0 && (
        <p className="text-sm text-gray-500 text-center">
          Showing {locations.length} location{locations.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}

interface LocationBrowserCardProps {
  location: Location
  onSelect: () => void
  isSelected: boolean
}

function LocationBrowserCard({ location, onSelect, isSelected }: LocationBrowserCardProps) {
  return (
    <Card className={`p-4 hover:border-rausch-300 transition-colors ${isSelected ? 'border-rausch-500 bg-rausch-50' : ''}`}>
      <div className="flex gap-4">
        {/* Image */}
        {location.featured_image && (
          <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
            <OptimizedImage
              src={location.featured_image}
              alt={location.name}
              width={96}
              height={96}
              preset="thumbnail"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 truncate">
                {location.name}
              </h4>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {location.city && `${location.city}, `}
                  {location.region && `${location.region}, `}
                  {location.country}
                </span>
              </p>
            </div>

            {/* Badges */}
            <div className="flex flex-col gap-1 items-end">
              {location.is_featured && (
                <Badge variant="secondary" className="text-xs">
                  Featured
                </Badge>
              )}
              {location.rating && (
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {location.rating}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {location.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {location.description}
            </p>
          )}

          {/* Stats & Action */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {location.visit_count} views
              </div>
            </div>

            <Button
              onClick={onSelect}
              size="sm"
              variant={isSelected ? 'default' : 'outline'}
              className={isSelected ? 'bg-rausch-600 hover:bg-rausch-700' : ''}
            >
              {isSelected ? (
                <>Selected</>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Add to Trip
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

