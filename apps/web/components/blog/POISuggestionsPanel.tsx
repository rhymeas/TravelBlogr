'use client'

/**
 * POI Suggestions Panel
 * 
 * Smart panel that shows POI suggestions when user adds a location.
 * Will be fully implemented in BATCH 2 with:
 * - OpenTripMap integration
 * - WikiVoyage data
 * - Database POIs
 * - Categorized suggestions (restaurants, attractions, etc.)
 */

import { X, MapPin, Utensils, Camera, Hotel, Activity } from 'lucide-react'

interface POI {
  id: string
  name: string
  category: string
  description?: string
  address?: string
  rating?: number
  price?: string
}

interface POISuggestionsPanelProps {
  location: string
  onSelectPOI: (poi: POI) => void
  onClose: () => void
}

export function POISuggestionsPanel({ location, onSelectPOI, onClose }: POISuggestionsPanelProps) {
  // Placeholder data - will be replaced with real API calls in BATCH 2
  const mockPOIs: POI[] = [
    {
      id: '1',
      name: 'Sample Restaurant',
      category: 'restaurant',
      description: 'Great local food',
      rating: 4.5
    },
    {
      id: '2',
      name: 'Sample Attraction',
      category: 'attraction',
      description: 'Must-see landmark',
      rating: 4.8
    }
  ]

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'restaurant':
        return <Utensils className="h-5 w-5" />
      case 'attraction':
        return <Camera className="h-5 w-5" />
      case 'hotel':
        return <Hotel className="h-5 w-5" />
      default:
        return <Activity className="h-5 w-5" />
    }
  }

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900">Suggestions</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>{location}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Coming Soon Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Coming in BATCH 2:</strong> Smart POI suggestions from OpenTripMap, WikiVoyage, and our database!
          </p>
        </div>

        {/* Mock POIs */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Top Attractions</h3>
          {mockPOIs.map(poi => (
            <button
              key={poi.id}
              onClick={() => onSelectPOI(poi)}
              className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-rausch-500 hover:bg-rausch-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  {getCategoryIcon(poi.category)}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{poi.name}</h4>
                  {poi.description && (
                    <p className="text-sm text-gray-600 mt-1">{poi.description}</p>
                  )}
                  {poi.rating && (
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-sm text-yellow-600">★</span>
                      <span className="text-sm text-gray-600">{poi.rating}</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

