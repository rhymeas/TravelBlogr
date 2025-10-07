'use client'

/**
 * Multi-location input with drag-and-drop reordering
 * A → B → C style
 */

import { useState } from 'react'
import { LocationAutocomplete } from './LocationAutocomplete'

interface Location {
  id: string
  value: string
}

interface LocationInputProps {
  locations: Location[]
  onChange: (locations: Location[]) => void
}

export function LocationInput({ locations, onChange }: LocationInputProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const addLocation = () => {
    onChange([
      ...locations,
      { id: crypto.randomUUID(), value: '' }
    ])
  }

  const removeLocation = (id: string) => {
    if (locations.length > 2) {
      onChange(locations.filter(loc => loc.id !== id))
    }
  }

  const updateLocation = (id: string, value: string) => {
    onChange(
      locations.map(loc =>
        loc.id === id ? { ...loc, value } : loc
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
                onChange={(value) => updateLocation(location.id, value)}
                className="border-gray-300 focus:border-black focus:ring-black"
              />
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

          {/* Connecting Line */}
          {index < locations.length - 1 && (
            <div className="absolute left-8 top-10 w-0.5 h-6 bg-gray-200" />
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

