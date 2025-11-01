'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Search, Loader2 } from 'lucide-react'
import { getBrowserSupabase } from '@/lib/supabase'

interface Location {
  id: string
  name: string
  slug: string
  country: string
  city: string | null
  latitude?: number | null
  longitude?: number | null
}

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onLocationSelect?: (location: Location) => void
  placeholder?: string
}

export function LocationAutocomplete({
  value,
  onChange,
  onLocationSelect,
  placeholder = 'Search for a location...'
}: LocationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search locations when user types
  useEffect(() => {
    const searchLocations = async () => {
      if (!value || value.length < 2) {
        setLocations([])
        return
      }

      setIsLoading(true)
      try {
        const supabase = getBrowserSupabase()
        const { data, error } = await supabase
          .from('locations')
          .select('id, name, slug, country, city, latitude, longitude')
          .or(`name.ilike.%${value}%,city.ilike.%${value}%,country.ilike.%${value}%`)
          .limit(10)

        if (error) throw error
        setLocations(data || [])
        setIsOpen(true)
      } catch (error) {
        console.error('Error searching locations:', error)
        setLocations([])
      } finally {
        setIsLoading(false)
      }
    }

    const debounce = setTimeout(searchLocations, 300)
    return () => clearTimeout(debounce)
  }, [value])

  const handleSelect = (location: Location) => {
    setSelectedLocation(location)
    onChange(location.name)
    onLocationSelect?.(location)
    setIsOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    setSelectedLocation(null)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => value.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rausch-500 focus:border-transparent"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
          ) : selectedLocation ? (
            <MapPin className="h-4 w-4 text-green-600" />
          ) : (
            <Search className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && locations.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {locations.map((location) => (
            <button
              key={location.id}
              onClick={() => handleSelect(location)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-rausch-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {location.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {location.city ? `${location.city}, ` : ''}{location.country}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {isOpen && !isLoading && value.length >= 2 && locations.length === 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center">
          <p className="text-sm text-gray-500">No locations found</p>
          <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
        </div>
      )}

      {/* Selected location info */}
      {selectedLocation && (
        <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
          <MapPin className="h-3 w-3" />
          <span>
            Linked to <a href={`/locations/${selectedLocation.slug}`} target="_blank" className="underline hover:text-green-700">
              {selectedLocation.name}
            </a>
          </span>
        </div>
      )}
    </div>
  )
}

