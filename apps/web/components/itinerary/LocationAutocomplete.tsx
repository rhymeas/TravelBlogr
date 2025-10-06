'use client'

/**
 * Location input with autocomplete dropdown
 */

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/Input'

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  className?: string
}

interface Location {
  slug: string
  name: string
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
  const wrapperRef = useRef<HTMLDivElement>(null)

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

  // Filter locations based on input
  useEffect(() => {
    if (!value.trim()) {
      setFilteredLocations([])
      setIsOpen(false)
      setHasInteracted(false)
      return
    }

    setHasInteracted(true)
    const query = value.toLowerCase()
    const filtered = locations.filter(loc =>
      loc.name.toLowerCase().includes(query) ||
      loc.slug.toLowerCase().includes(query)
    )

    setFilteredLocations(filtered)
    setIsOpen(filtered.length > 0 || locations.length === 0)
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

  const handleSelect = (location: Location) => {
    onChange(location.slug)
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredLocations.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredLocations.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSelect(filteredLocations[selectedIndex])
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />

      {/* Dropdown */}
      {isOpen && filteredLocations.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
          {filteredLocations.map((location, index) => (
            <button
              key={location.slug}
              type="button"
              onClick={() => handleSelect(location)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                index === selectedIndex ? 'bg-gray-50' : ''
              } ${
                index === 0 ? 'rounded-t-xl' : ''
              } ${
                index === filteredLocations.length - 1 ? 'rounded-b-xl' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{location.name}</div>
                  <div className="text-xs text-gray-500">{location.slug}</div>
                </div>
              </div>
              {index === selectedIndex && (
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      {/* No results - but allow custom input */}
      {hasInteracted && isOpen && value.trim() && filteredLocations.length === 0 && locations.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4">
          <div className="text-sm text-gray-500">
            <div className="mb-2 font-medium text-gray-700">"{value}" not in database</div>
            <div className="text-xs text-gray-400 mb-3">
              No problem! We'll search the internet and create this location for you.
            </div>
            <div className="flex items-center gap-2 text-xs text-green-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Press Enter or click Generate to continue
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

