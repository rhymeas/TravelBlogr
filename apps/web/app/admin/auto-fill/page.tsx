'use client'

/**
 * Admin: Auto-Fill Location Content
 *
 * Simple UI to auto-populate location data using FREE APIs:
 * - OpenStreetMap Nominatim (geocoding - auto-find coordinates!)
 * - OpenStreetMap Overpass (restaurants, activities)
 * - Unsplash (images)
 * - Wikipedia (descriptions)
 * - OpenWeatherMap (weather)
 */

import { useState } from 'react'

interface AutoFillResponse {
  success: boolean
  message: string
  location?: {
    id?: string
    name: string
    slug?: string
    coordinates: {
      latitude: number
      longitude: number
    }
    country: string
    region: string
    fullName: string
  }
  results?: {
    restaurants: number
    activities: number
    images: number
    description: boolean
    weather: boolean
  }
  nextSteps?: string[]
  errors?: string[]
  error?: string
  details?: string
  existingLocation?: {
    id: string
    name: string
    slug: string
  }
}

export default function AutoFillPage() {
  const [locationName, setLocationName] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<AutoFillResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAutoFill = async () => {
    if (!locationName.trim()) {
      setError('Please enter a location name')
      return
    }

    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const autoFillResponse = await fetch('/api/admin/auto-fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationName: locationName.trim()
        })
      })

      const data = await autoFillResponse.json()

      if (!autoFillResponse.ok) {
        throw new Error(data.error || 'Auto-fill failed')
      }

      setResponse(data)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🪄 Auto-Fill Location Content
          </h1>
          <p className="text-gray-600 mb-8">
            Just enter a location name - we'll find everything else automatically!
          </p>

          {/* Form */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Name
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAutoFill()}
                placeholder="e.g., Banff National Park, Tokyo, Paris, New York..."
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <p className="text-sm text-gray-500 mt-2">
                💡 Tip: Be specific! "Banff National Park" works better than just "Banff"
              </p>
            </div>

            <button
              onClick={handleAutoFill}
              disabled={loading || !locationName.trim()}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl"
            >
              {loading ? '⏳ Auto-filling... (10-30 seconds)' : '🚀 Auto-Fill Content'}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">❌ Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          {/* API Error with Details */}
          {response && !response.success && (
            <div className="mt-8 bg-red-50 border-2 border-red-300 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-red-600 mb-3">
                {response.error === 'Location already exists' ? '⚠️ Duplicate Location' : '❌ Error'}
              </h2>
              <p className="text-red-800 text-lg mb-3">{response.error || 'An error occurred'}</p>
              {response.details && (
                <p className="text-red-700 text-base mb-4">{response.details}</p>
              )}
              {response.existingLocation && (
                <div className="bg-red-100 border border-red-400 rounded p-4 mt-4">
                  <p className="text-red-900 font-bold mb-2">Existing Location:</p>
                  <p className="text-red-800"><strong>Name:</strong> {response.existingLocation.name}</p>
                  <p className="text-red-800"><strong>Slug:</strong> {response.existingLocation.slug}</p>
                  <p className="text-red-800"><strong>ID:</strong> {response.existingLocation.id}</p>
                  <p className="text-red-700 text-sm mt-3">
                    💡 Tip: Try a more specific name like "{locationName}, Country" or edit the existing location in Supabase.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {response && response.success && (
            <div className="mt-8 space-y-4">
              <h2 className="text-2xl font-bold text-green-600">✅ {response.message}</h2>

              {response.location && (
                <>
                  <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6">
                    <p className="text-green-900 font-bold text-lg mb-3">📍 Location Created!</p>
                    <div className="space-y-2 text-green-800">
                      {response.location.id && <p><strong>ID:</strong> {response.location.id}</p>}
                      <p><strong>Name:</strong> {response.location.name}</p>
                      {response.location.slug && <p><strong>Slug:</strong> {response.location.slug}</p>}
                      <p><strong>Full Name:</strong> {response.location.fullName}</p>
                      <p><strong>Coordinates:</strong> {response.location.coordinates.latitude.toFixed(6)}, {response.location.coordinates.longitude.toFixed(6)}</p>
                      <p><strong>Country:</strong> {response.location.country}</p>
                      <p><strong>Region:</strong> {response.location.region}</p>
                    </div>
                  </div>

                  {response.results && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 text-center">
                        <p className="text-orange-900 font-bold text-sm mb-2">🍽️ Restaurants</p>
                        <p className="text-4xl font-bold text-orange-600">{response.results.restaurants}</p>
                      </div>

                      <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 text-center">
                        <p className="text-blue-900 font-bold text-sm mb-2">🎯 Activities</p>
                        <p className="text-4xl font-bold text-blue-600">{response.results.activities}</p>
                      </div>

                      <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4 text-center">
                        <p className="text-purple-900 font-bold text-sm mb-2">📸 Images</p>
                        <p className="text-4xl font-bold text-purple-600">{response.results.images}</p>
                      </div>

                      <div className="bg-indigo-50 border-2 border-indigo-300 rounded-lg p-4 text-center">
                        <p className="text-indigo-900 font-bold text-sm mb-2">📝 Description</p>
                        <p className="text-4xl font-bold text-indigo-600">
                          {response.results.description ? '✓' : '✗'}
                        </p>
                      </div>

                      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 text-center">
                        <p className="text-yellow-900 font-bold text-sm mb-2">☁️ Weather</p>
                        <p className="text-4xl font-bold text-yellow-600">
                          {response.results.weather ? '✓' : '✗'}
                        </p>
                      </div>

                      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 text-center">
                        <p className="text-green-900 font-bold text-sm mb-2">📊 Total</p>
                        <p className="text-4xl font-bold text-green-600">
                          {response.results.restaurants + response.results.activities + response.results.images}
                        </p>
                      </div>
                    </div>
                  )}

                  {response.errors && response.errors.length > 0 && (
                    <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-6">
                      <p className="text-orange-900 font-bold text-lg mb-3">⚠️ Warnings:</p>
                      <ul className="space-y-1">
                        {response.errors.map((err, i) => (
                          <li key={i} className="text-orange-800 text-sm">• {err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {response.nextSteps && response.nextSteps.length > 0 && (
                    <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
                      <p className="text-blue-900 font-bold text-lg mb-3">🚀 Next Steps:</p>
                      <ul className="space-y-2">
                        {response.nextSteps.map((step, i) => (
                          <li key={i} className="text-blue-800 text-base">{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg p-6">
                    <p className="text-purple-900 font-bold text-lg mb-3">🎉 Auto-Fill Complete!</p>
                    <p className="text-purple-800 text-base">
                      Your location has been created with all available data from free APIs!
                      Check your Supabase database to see the restaurants, activities, and more.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              🆓 100% Free APIs - No Coordinates Needed!
            </h3>
            <ul className="space-y-2 text-blue-800 text-sm">
              <li>✅ <strong>OpenStreetMap Nominatim:</strong> Auto-finds coordinates (unlimited)</li>
              <li>✅ <strong>OpenStreetMap Overpass:</strong> Restaurants & activities (unlimited)</li>
              <li>✅ <strong>Unsplash:</strong> High-quality images (50/hour)</li>
              <li>✅ <strong>Wikipedia:</strong> Descriptions & facts (unlimited)</li>
              <li>✅ <strong>OpenWeatherMap:</strong> Current weather (1000/day)</li>
            </ul>
            <p className="text-blue-700 text-sm mt-4 font-medium">
              🎉 Just type a location name and we handle the rest!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

