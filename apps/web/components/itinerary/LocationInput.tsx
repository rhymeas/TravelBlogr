'use client'

/**
 * Multi-location input with drag-and-drop reordering
 * A → B → C style
 */

import { useState } from 'react'
import { LocationAutocomplete } from './LocationAutocomplete'
import { Plus, Loader2 } from 'lucide-react'

interface Location {
  id: string
  value: string
  region?: string
  country?: string
}

interface LocationInputProps {
  locations: Location[]
  onChange: (locations: Location[]) => void
}

interface SuggestedStop {
  name: string
  region?: string
  country?: string
}

export function LocationInput({ locations, onChange }: LocationInputProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [loadingStops, setLoadingStops] = useState<number | null>(null)
  const [suggestedStops, setSuggestedStops] = useState<Record<number, SuggestedStop[]>>({})
  const [showSuggestions, setShowSuggestions] = useState<number | null>(null)

  const addLocation = () => {
    onChange([
      ...locations,
      { id: crypto.randomUUID(), value: '' }
    ])
  }

  const addLocationBetween = (afterIndex: number, value: string = '') => {
    const newLocation = { id: crypto.randomUUID(), value }
    const newLocations = [...locations]
    newLocations.splice(afterIndex + 1, 0, newLocation)
    onChange(newLocations)
  }

  const removeLocation = (id: string) => {
    if (locations.length > 2) {
      onChange(locations.filter(loc => loc.id !== id))
    }
  }

  const updateLocation = (id: string, value: string, metadata?: { region?: string; country?: string }) => {
    onChange(
      locations.map(loc =>
        loc.id === id ? { ...loc, value, region: metadata?.region, country: metadata?.country } : loc
      )
    )
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newLocations = [...locations]
    const [draggedItem] = newLocations.splice(draggedIndex, 1)
    newLocations.splice(dropIndex, 0, draggedItem)

    onChange(newLocations)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const fetchSuggestedStops = async (fromLocation: string, toLocation: string, lineIndex: number) => {
    if (!fromLocation || !toLocation) return

    // Check if we already have suggestions cached
    if (suggestedStops[lineIndex]) {
      setShowSuggestions(lineIndex)
      return
    }

    setLoadingStops(lineIndex)

    try {
      const response = await fetch('/api/itineraries/suggest-stops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: fromLocation, to: toLocation })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.stops) {
          setSuggestedStops(prev => ({ ...prev, [lineIndex]: data.stops }))
          setShowSuggestions(lineIndex)
        }
      }
    } catch (error) {
      console.error('Error fetching stops:', error)
    } finally {
      setLoadingStops(null)
    }
  }

  const handleAddSuggestedStop = (lineIndex: number, stop: SuggestedStop) => {
    addLocationBetween(lineIndex, stop.name)
    setShowSuggestions(null)
  }

  return (
    <div className="space-y-3">
      {locations.map((location, index) => (
        <div
          key={location.id}
          className="relative"
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
        >
          {/* Location Input */}
          <div className={`flex items-center gap-3 transition-all ${
            draggedIndex === index ? 'opacity-50 scale-95' : ''
          } ${
            dragOverIndex === index && draggedIndex !== index
              ? 'border-2 border-dashed border-blue-400 rounded-lg p-2 -m-2'
              : ''
          }`}>
            {/* Drag Handle */}
            <div className="flex-shrink-0 cursor-grab active:cursor-grabbing">
              <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </div>

            {/* Icon */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              {index === 0 ? (
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ) : index === locations.length - 1 ? (
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <div className="w-3 h-3 rounded-full bg-gray-400" />
              )}
            </div>

            {/* Input Field with Autocomplete */}
            <div className="flex-1">
              <LocationAutocomplete
                placeholder={
                  index === 0
                    ? 'Starting location (e.g., paris)'
                    : index === locations.length - 1
                    ? 'Final destination (e.g., rome)'
                    : 'Stop along the way'
                }
                value={location.value}
                onChange={(value, metadata) => updateLocation(location.id, value, metadata)}
                className="border-gray-300 focus:border-black focus:ring-black"
              />
              {/* Show location hierarchy below input if available */}
              {location.value && (location.region || location.country) && (() => {
                // Filter out "unknown" values
                const validRegion = location.region && location.region.toLowerCase() !== 'unknown' ? location.region : null
                const validCountry = location.country && location.country.toLowerCase() !== 'unknown' ? location.country : null

                // Only show if we have at least one valid piece of info
                if (!validRegion && !validCountry) return null

                return (
                  <div className="text-xs text-gray-500 mt-1 pl-3">
                    {validRegion && `${validRegion}, `}
                    {validCountry}
                  </div>
                )
              })()}
            </div>

            {/* Remove Button (only for middle locations) */}
            {index > 0 && index < locations.length - 1 && (
              <button
                type="button"
                onClick={() => removeLocation(location.id)}
                className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Connecting Line (simple dashed line) */}
          {index < locations.length - 1 && (
            <div className="relative">
              {/* Dashed Line */}
              <div className="absolute left-[52px] top-[56px] w-0.5 h-[32px] bg-gray-300 border-l-2 border-dashed border-gray-300" style={{ background: 'transparent' }} />
            </div>
          )}

          {/* Suggested Stops Dropdown (triggered from "Add stop along the way" button) */}
          {index < locations.length - 1 && showSuggestions === index && suggestedStops[index] && suggestedStops[index].length > 0 && (
            <div className="relative">
              <div className="absolute left-[80px] top-[56px] z-20 bg-white rounded-xl shadow-lg border border-gray-200 p-3 min-w-[280px]">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900">Suggested stops</h4>
                    <button
                      type="button"
                      onClick={() => setShowSuggestions(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-1">
                    {suggestedStops[index].slice(0, 5).map((stop, stopIndex) => (
                      <button
                        key={stopIndex}
                        type="button"
                        onClick={() => handleAddSuggestedStop(index, stop)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
                      >
                        <div className="text-sm font-medium text-gray-900 group-hover:text-rausch-500">
                          {stop.name}
                        </div>
                        {(stop.region || stop.country) && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {stop.region && `${stop.region}, `}{stop.country}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      addLocationBetween(index)
                      setShowSuggestions(null)
                    }}
                    className="w-full mt-2 pt-2 border-t border-gray-100 text-xs text-gray-600 hover:text-gray-900 text-center"
                  >
                    + Add custom location
                  </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add Location Button */}
      {locations.length < 5 && (
        <button
          type="button"
          onClick={addLocation}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-black border border-dashed border-gray-300 hover:border-gray-400 rounded-xl transition-colors w-full justify-center"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add stop along the way
        </button>
      )}

      {/* Helper Text */}
      <p className="text-xs text-gray-500 pl-13">
        {locations.length === 2 
          ? 'Add stops to visit places along your route'
          : `${locations.length - 2} stop${locations.length > 3 ? 's' : ''} added`
        }
      </p>
    </div>
  )
}

