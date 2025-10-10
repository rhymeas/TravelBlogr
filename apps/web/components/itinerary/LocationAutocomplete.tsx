'use client'

/**
 * Location input with autocomplete dropdown
 */

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/Input'

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string, metadata?: { region?: string; country?: string }) => void
  placeholder: string
  className?: string
}

interface Location {
  slug: string
  name: string
  region?: string
  country?: string
}

export function LocationAutocomplete({
  value,
  onChange,
  placeholder,
  className
}: LocationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const wrapperRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch available locations on mount
  useEffect(() => {
    fetch('/api/locations')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLocations(data.data)
        }
      })
      .catch(err => console.error('Failed to fetch locations:', err))
  }, [])

  // Search for locations (database + geocoding)
  useEffect(() => {
    if (!value.trim()) {
      setFilteredLocations([])
      setSearchResults([])
      setIsOpen(false)
      setHasInteracted(false)
      return
    }

    // Only open dropdown if input is focused
    if (document.activeElement !== inputRef.current) {
      return
    }

    setHasInteracted(true)

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Filter database locations
    const query = value.toLowerCase()
    const filtered = locations.filter(loc =>
      loc.name.toLowerCase().includes(query) ||
      loc.slug.toLowerCase().includes(query) ||
      loc.country?.toLowerCase().includes(query)
    )

    setFilteredLocations(filtered)

    // Search geocoding API after 300ms delay (debounce)
    searchTimeoutRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/locations/search?q=${encodeURIComponent(value)}&limit=5`)
        const data = await response.json()

        if (data.success) {
          // Filter out results already in database
          const newResults = data.data.filter((result: any) =>
            !filtered.some(loc =>
              loc.name.toLowerCase() === result.name.toLowerCase() &&
              loc.country?.toLowerCase() === result.country.toLowerCase()
            )
          )
          setSearchResults(newResults)
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    setIsOpen(true)
    setSelectedIndex(-1)
  }, [value, locations])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (location: Location | any) => {
    // If it's a database location, use slug
    // If it's a search result, use the full display name
    const locationValue = location.slug || location.displayName || location.name

    // Pass metadata for display purposes
    const metadata = {
      region: location.region,
      country: location.country
    }

    // Close dropdown and blur input to prevent reopening
    setIsOpen(false)
    setSelectedIndex(-1)
    setFilteredLocations([])
    setSearchResults([])
    inputRef.current?.blur()

    onChange(locationValue, metadata)
  }

  const handleUseCustom = () => {
    // User wants to use exactly what they typed
    setIsOpen(false)
    setSelectedIndex(-1)
    setFilteredLocations([])
    setSearchResults([])
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const allResults = [...filteredLocations, ...searchResults]

    if (!isOpen || allResults.length === 0) {
      // Allow Enter to accept custom input
      if (e.key === 'Enter' && value.trim()) {
        e.preventDefault()
        handleUseCustom()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < allResults.length ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < allResults.length) {
          handleSelect(allResults[selectedIndex])
        } else {
          // Use custom input
          handleUseCustom()
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (value.trim() && (filteredLocations.length > 0 || searchResults.length > 0)) {
            setIsOpen(true)
          }
        }}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />

      {/* Dropdown */}
      {isOpen && (filteredLocations.length > 0 || searchResults.length > 0 || value.trim()) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-auto">
          {/* Database locations */}
          {filteredLocations.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 sticky top-0">
                From your locations
              </div>
              {filteredLocations.map((location, index) => (
                <button
                  key={location.slug}
                  type="button"
                  onClick={() => handleSelect(location)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center justify-between ${
                    index === selectedIndex ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{location.name}</div>
                      {(() => {
                        const validRegion = location.region && location.region.toLowerCase() !== 'unknown' ? location.region : null
                        const validCountry = location.country && location.country.toLowerCase() !== 'unknown' ? location.country : null

                        if (!validRegion && !validCountry) return null

                        return (
                          <div className="text-xs text-gray-500">
                            {validRegion && `${validRegion}, `}
                            {validCountry}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Search results from geocoding */}
          {searchResults.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 sticky top-0">
                {isLoading ? 'Searching...' : 'Other locations'}
              </div>
              {searchResults.map((result, index) => {
                const actualIndex = filteredLocations.length + index
                return (
                  <button
                    key={`${result.name}-${result.country}-${index}`}
                    type="button"
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setSelectedIndex(actualIndex)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                      actualIndex === selectedIndex ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{result.name}</div>
                        {(() => {
                          const validRegion = result.region && result.region.toLowerCase() !== 'unknown' ? result.region : null
                          const validCountry = result.country && result.country.toLowerCase() !== 'unknown' ? result.country : null

                          if (!validRegion && !validCountry) return null

                          return (
                            <div className="text-xs text-gray-500">
                              {validRegion && `${validRegion}, `}
                              {validCountry}
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}



          {/* Loading state */}
          {isLoading && searchResults.length === 0 && (
            <div className="px-4 py-3 text-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mx-auto mb-2"></div>
              Searching worldwide...
            </div>
          )}
        </div>
      )}


    </div>
  )
}

