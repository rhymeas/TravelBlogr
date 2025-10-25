'use client'

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic'

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
import { AdminBreadcrumb } from '@/components/admin/AdminNav'
import { AlertCircle, CheckCircle2, Loader2, MapPin, Zap, Trash2, MoreVertical } from 'lucide-react'
import Link from 'next/link'

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <AdminBreadcrumb currentPage="Auto-Fill" />
          <div className="mt-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Auto-Fill Location Content</h1>
            <p className="text-gray-600 text-lg">
              Enter a location name and we'll automatically populate all data from free APIs
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form - Left Side (2 columns) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
              {/* Form */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Location Name
                  </label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAutoFill()}
                    placeholder="e.g., Banff National Park, Tokyo, Paris..."
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                    autoFocus
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Be specific: "Banff National Park" works better than just "Banff"
                  </p>
                </div>

                <button
                  onClick={handleAutoFill}
                  disabled={loading || !locationName.trim()}
                  className="w-full bg-gray-900 text-white py-3 px-6 rounded-lg font-semibold text-base hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Auto-filling... (10-30 seconds)
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5" />
                      Auto-Fill Content
                    </>
                  )}
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-gray-900 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Error</p>
                    <p className="text-gray-600 text-sm mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* API Error with Details */}
              {response && !response.success && (
                <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex gap-3 mb-4">
                    <AlertCircle className="h-6 w-6 text-gray-900 flex-shrink-0" />
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        {response.error === 'Location already exists' ? 'Duplicate Location' : 'Error'}
                      </h2>
                    </div>
                  </div>
                  <p className="text-gray-700 text-base mb-4">{response.error || 'An error occurred'}</p>
                  {response.details && (
                    <p className="text-gray-600 text-base mb-4">{response.details}</p>
                  )}
                  {response.existingLocation && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                      <p className="text-gray-900 font-semibold mb-3">Existing Location:</p>
                      <div className="space-y-2 text-gray-700 text-sm">
                        <p><span className="font-medium">Name:</span> {response.existingLocation.name}</p>
                        <p><span className="font-medium">Slug:</span> {response.existingLocation.slug}</p>
                        <p><span className="font-medium">ID:</span> {response.existingLocation.id}</p>
                      </div>
                      <p className="text-gray-600 text-sm mt-3">
                        Try a more specific name like "{locationName}, Country" or edit the existing location in Supabase.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Results */}
              {response && response.success && (
                <div className="mt-8 space-y-6">
                  {/* Green Success Hint */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3 items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-green-900 font-semibold">
                        Successfully auto-filled {response.location?.name}
                        {response.location?.region && `, ${response.location.region}`}
                        {response.location?.country && `, ${response.location.country}`}! 🎉
                      </p>
                    </div>
                  </div>

                  {response.location && (
                    <>
                      {/* Location Card Preview - How it will look on /locations */}
                      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        {/* Card Header with Image Placeholder */}
                        <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                          <div className="text-center">
                            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">Featured Image</p>
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-4">
                          <h3 className="text-lg font-bold text-gray-900 mb-1">{response.location.name}</h3>
                          <p className="text-sm text-gray-600 mb-4">
                            🗺️ {response.location.country}
                            {response.location.region && ` • ${response.location.region}`}
                          </p>

                          {/* Stats */}
                          <div className="grid grid-cols-3 gap-2 mb-4 text-center text-xs">
                            <div className="bg-gray-50 rounded p-2">
                              <p className="text-gray-600">Restaurants</p>
                              <p className="font-bold text-gray-900">{response.results?.restaurants || 0}</p>
                            </div>
                            <div className="bg-gray-50 rounded p-2">
                              <p className="text-gray-600">Activities</p>
                              <p className="font-bold text-gray-900">{response.results?.activities || 0}</p>
                            </div>
                            <div className="bg-gray-50 rounded p-2">
                              <p className="text-gray-600">Images</p>
                              <p className="font-bold text-gray-900">{response.results?.images || 0}</p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Link
                              href={`/locations/${response.location.slug}`}
                              className="flex-1 bg-gray-900 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors text-center"
                            >
                              View
                            </Link>
                            <button
                              onClick={() => {
                                // Delete location
                                fetch('/api/admin/delete-location', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    locationId: response.location?.id,
                                    locationName: response.location?.name
                                  })
                                }).then(() => {
                                  setResponse(null)
                                  setLocationName('')
                                })
                              }}
                              className="bg-red-50 text-red-600 py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Location Details */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <div className="flex gap-2 items-center mb-4">
                          <MapPin className="h-5 w-5 text-gray-900" />
                          <h3 className="font-semibold text-gray-900">Location Created</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {response.location.id && (
                            <div>
                              <p className="text-gray-600">ID</p>
                              <p className="font-mono text-gray-900 text-xs mt-1">{response.location.id}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-600">Name</p>
                            <p className="text-gray-900 font-medium mt-1">{response.location.name}</p>
                          </div>
                          {response.location.slug && (
                            <div>
                              <p className="text-gray-600">Slug</p>
                              <p className="text-gray-900 font-mono text-xs mt-1">{response.location.slug}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-600">Country</p>
                            <p className="text-gray-900 font-medium mt-1">{response.location.country}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-gray-600">Coordinates</p>
                            <p className="text-gray-900 font-mono text-xs mt-1">
                              {response.location.coordinates.latitude.toFixed(6)}, {response.location.coordinates.longitude.toFixed(6)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Results Grid */}
                      {response.results && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                            <p className="text-gray-600 font-medium text-sm mb-2">Restaurants</p>
                            <p className="text-3xl font-bold text-gray-900">{response.results.restaurants}</p>
                          </div>

                          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                            <p className="text-gray-600 font-medium text-sm mb-2">Activities</p>
                            <p className="text-3xl font-bold text-gray-900">{response.results.activities}</p>
                          </div>

                          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                            <p className="text-gray-600 font-medium text-sm mb-2">Images</p>
                            <p className="text-3xl font-bold text-gray-900">{response.results.images}</p>
                          </div>

                          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                            <p className="text-gray-600 font-medium text-sm mb-2">Description</p>
                            <p className="text-3xl font-bold text-gray-900">
                              {response.results.description ? '✓' : '✗'}
                            </p>
                          </div>

                          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                            <p className="text-gray-600 font-medium text-sm mb-2">Weather</p>
                            <p className="text-3xl font-bold text-gray-900">
                              {response.results.weather ? '✓' : '✗'}
                            </p>
                          </div>

                          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                            <p className="text-gray-600 font-medium text-sm mb-2">Total Items</p>
                            <p className="text-3xl font-bold text-gray-900">
                              {response.results.restaurants + response.results.activities + response.results.images}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Warnings */}
                      {response.errors && response.errors.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <p className="text-gray-900 font-semibold mb-3">Warnings</p>
                          <ul className="space-y-2">
                            {response.errors.map((err, i) => (
                              <li key={i} className="text-gray-700 text-sm flex gap-2">
                                <span className="text-gray-400">•</span> {err}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Next Steps */}
                      {response.nextSteps && response.nextSteps.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <p className="text-gray-900 font-semibold mb-3">Next Steps</p>
                          <ul className="space-y-2">
                            {response.nextSteps.map((step, i) => (
                              <li key={i} className="text-gray-700 text-sm flex gap-2">
                                <span className="text-gray-400">→</span> {step}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Success Message */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <p className="text-gray-900 font-semibold mb-2">Auto-Fill Complete</p>
                        <p className="text-gray-600 text-sm">
                          Your location has been created with all available data from free APIs. Check your Supabase database to see the restaurants, activities, and more.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Sidebar - Right Side (1 column) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm sticky top-8">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                Data Sources
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="text-gray-400 flex-shrink-0">✓</span>
                  <div>
                    <p className="font-medium text-gray-900">OpenStreetMap Nominatim</p>
                    <p className="text-gray-600 text-xs">Auto-finds coordinates</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-gray-400 flex-shrink-0">✓</span>
                  <div>
                    <p className="font-medium text-gray-900">OpenStreetMap Overpass</p>
                    <p className="text-gray-600 text-xs">Restaurants & activities</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-gray-400 flex-shrink-0">✓</span>
                  <div>
                    <p className="font-medium text-gray-900">Brave Search</p>
                    <p className="text-gray-600 text-xs">High-quality images</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-gray-400 flex-shrink-0">✓</span>
                  <div>
                    <p className="font-medium text-gray-900">Wikipedia</p>
                    <p className="text-gray-600 text-xs">Descriptions & facts</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-gray-400 flex-shrink-0">✓</span>
                  <div>
                    <p className="font-medium text-gray-900">Open-Meteo</p>
                    <p className="text-gray-600 text-xs">Current weather</p>
                  </div>
                </li>
              </ul>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  All APIs are 100% free with no API keys required. Processing typically takes 10-30 seconds.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

