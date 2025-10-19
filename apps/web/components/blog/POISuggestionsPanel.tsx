'use client'

/**
 * POI Suggestions Panel
 * 
 * Smart panel that shows POI suggestions when user adds a location.
 * Uses intelligent data hierarchy:
 * 1. Database locations and POIs
 * 2. Existing trips to this location
 * 3. Existing blog posts about this location
 * 4. External APIs (future)
 * 5. GROQ AI suggestions (future)
 */

import { useState, useEffect } from 'react'
import { X, MapPin, Utensils, Camera, Hotel, Activity, Loader2, CheckCircle } from 'lucide-react'
import type { POISuggestion, TripActivity } from '@/lib/services/locationIntelligenceService'

interface POISuggestionsPanelProps {
  location: string
  onSelectPOI: (poi: POISuggestion) => void
  onSelectActivity: (activity: TripActivity) => void
  onClose: () => void
}

export function POISuggestionsPanel({ location, onSelectPOI, onSelectActivity, onClose }: POISuggestionsPanelProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [intelligence, setIntelligence] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'pois' | 'activities' | 'trips'>('pois')

  useEffect(() => {
    loadIntelligence()
  }, [location])

  const loadIntelligence = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/location-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationName: location })
      })

      if (!response.ok) {
        throw new Error('Failed to load intelligence')
      }

      const result = await response.json()
      setIntelligence(result.data)
      console.log('Intelligence loaded:', result.data)
    } catch (error) {
      console.error('Error loading intelligence:', error)
    } finally {
      setIsLoading(false)
    }
  }

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

  const getSourceBadge = (source: string) => {
    const badges = {
      database: { label: 'Database', color: 'bg-blue-100 text-blue-700' },
      trips: { label: 'From Trips', color: 'bg-green-100 text-green-700' },
      blog_posts: { label: 'From Blog', color: 'bg-purple-100 text-purple-700' },
      external: { label: 'External', color: 'bg-orange-100 text-orange-700' },
      ai: { label: 'AI Generated', color: 'bg-pink-100 text-pink-700' }
    }
    const badge = badges[source as keyof typeof badges] || badges.database
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900">Smart Suggestions</h2>
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

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-rausch-600" />
        </div>
      )}

      {/* Content */}
      {!isLoading && intelligence && (
        <div className="p-6 space-y-6">
          {/* Data Source Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-2">Data Found</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  {intelligence.location && (
                    <div>✓ Location in database</div>
                  )}
                  {intelligence.pois.length > 0 && (
                    <div>✓ {intelligence.pois.length} POIs</div>
                  )}
                  {intelligence.activities.length > 0 && (
                    <div>✓ {intelligence.activities.length} Activities</div>
                  )}
                  {intelligence.existingTrips.length > 0 && (
                    <div>✓ {intelligence.existingTrips.length} Existing trips</div>
                  )}
                  {intelligence.existingBlogPosts.length > 0 && (
                    <div>✓ {intelligence.existingBlogPosts.length} Blog posts</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('pois')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'pois'
                  ? 'text-rausch-600 border-b-2 border-rausch-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              POIs ({intelligence.pois.length})
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'activities'
                  ? 'text-rausch-600 border-b-2 border-rausch-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Activities ({intelligence.activities.length})
            </button>
            <button
              onClick={() => setActiveTab('trips')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'trips'
                  ? 'text-rausch-600 border-b-2 border-rausch-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Trips ({intelligence.existingTrips.length})
            </button>
          </div>

          {/* POIs Tab */}
          {activeTab === 'pois' && (
            <div className="space-y-4">
              {intelligence.pois.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Camera className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No POIs found yet</p>
                  <p className="text-sm mt-1">Try adding activities to your trips!</p>
                </div>
              ) : (
                intelligence.pois.map((poi: POISuggestion) => (
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
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-gray-900">{poi.name}</h4>
                          {getSourceBadge(poi.source)}
                        </div>
                        {poi.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{poi.description}</p>
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
                ))
              )}
            </div>
          )}

          {/* Activities Tab */}
          {activeTab === 'activities' && (
            <div className="space-y-4">
              {intelligence.activities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No activities found yet</p>
                </div>
              ) : (
                intelligence.activities.map((activity: TripActivity, index: number) => (
                  <button
                    key={index}
                    onClick={() => onSelectActivity(activity)}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-rausch-500 hover:bg-rausch-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-gray-900">{activity.name}</h4>
                      {getSourceBadge(activity.source)}
                    </div>
                    {activity.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{activity.description}</p>
                    )}
                    {activity.tips && (
                      <div className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        💡 {activity.tips}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          )}

          {/* Trips Tab */}
          {activeTab === 'trips' && (
            <div className="space-y-4">
              {intelligence.existingTrips.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No existing trips found</p>
                </div>
              ) : (
                intelligence.existingTrips.map((trip: any) => (
                  <div
                    key={trip.id}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <h4 className="font-medium text-gray-900 mb-2">{trip.title}</h4>
                    {trip.description && (
                      <p className="text-sm text-gray-600 mb-2">{trip.description}</p>
                    )}
                    {trip.posts && (
                      <div className="text-sm text-gray-500">
                        {trip.posts.length} days
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

