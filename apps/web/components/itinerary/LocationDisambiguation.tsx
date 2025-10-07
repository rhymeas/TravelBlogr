'use client'

import { useState, useEffect } from 'react'
import { MapPin, Globe, Navigation } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface LocationOption {
  name: string
  country: string
  region: string
  latitude: number
  longitude: number
  displayName: string
  importance?: number
  type?: string
}

interface LocationDisambiguationProps {
  query: string
  onSelect: (location: LocationOption) => void
  onCancel: () => void
}

/**
 * Location Disambiguation Component
 * Shows multiple location options when there are ambiguous matches
 * Example: "Sunshine Coast" → Australia vs Canada
 */
export function LocationDisambiguation({
  query,
  onSelect,
  onCancel
}: LocationDisambiguationProps) {
  const [options, setOptions] = useState<LocationOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    searchLocations()
  }, [query])

  const searchLocations = async () => {
    setLoading(true)
    try {
      // Search Nominatim for multiple results
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}` +
        `&format=json` +
        `&limit=10` +
        `&addressdetails=1` +
        `&accept-language=en`,
        {
          headers: {
            'User-Agent': 'TravelBlogr/1.0'
          }
        }
      )

      const results = await response.json()

      // Filter and format results
      const locationOptions: LocationOption[] = results
        .filter((r: any) => {
          // Only show cities, towns, villages, or notable places
          const validTypes = ['city', 'town', 'village', 'municipality', 'county', 'state', 'region']
          return validTypes.includes(r.type) || validTypes.includes(r.class)
        })
        .map((r: any) => ({
          name: r.name || r.display_name.split(',')[0],
          country: r.address?.country || 'Unknown',
          region: r.address?.state || r.address?.region || r.address?.county || '',
          latitude: parseFloat(r.lat),
          longitude: parseFloat(r.lon),
          displayName: r.display_name,
          importance: r.importance,
          type: r.type
        }))
        // Remove duplicates (same name + country)
        .filter((loc, index, self) =>
          index === self.findIndex(l => 
            l.name === loc.name && l.country === loc.country
          )
        )
        // Sort by importance
        .sort((a, b) => (b.importance || 0) - (a.importance || 0))
        .slice(0, 5) // Top 5 results

      setOptions(locationOptions)
    } catch (error) {
      console.error('Error searching locations:', error)
      setOptions([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Searching for "{query}"...</p>
        </div>
      </Card>
    )
  }

  if (options.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No locations found</h3>
          <p className="text-gray-600 mb-4">
            We couldn't find any locations matching "{query}"
          </p>
          <Button onClick={onCancel} variant="outline">
            Try different search
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Which "{query}" did you mean?
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          We found {options.length} location{options.length > 1 ? 's' : ''} with this name
        </p>
      </div>

      <div className="space-y-3">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => onSelect(option)}
            className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                  <span className="font-semibold text-gray-900">
                    {option.name}
                  </span>
                  {index === 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      Most likely
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600 ml-6">
                  <Globe className="h-3 w-3" />
                  <span>
                    {option.region && `${option.region}, `}
                    {option.country}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mt-1 ml-6 line-clamp-1">
                  {option.displayName}
                </p>
              </div>

              <div className="text-xs text-gray-400 ml-4">
                {option.latitude.toFixed(4)}, {option.longitude.toFixed(4)}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t">
        <Button onClick={onCancel} variant="outline" className="w-full">
          Cancel and search again
        </Button>
      </div>
    </Card>
  )
}

