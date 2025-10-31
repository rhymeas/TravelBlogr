'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { AdminBreadcrumb } from '@/components/admin/AdminNav'
import { Trash2, Loader2, AlertCircle, CheckCircle2, Eye, Database } from 'lucide-react'

interface LocationToDelete {
  id: string
  name: string
  slug: string
  country: string
  created_at: string
  rating_count?: number
  view_count?: number
}

interface DeletionStats {
  locations: number
  location_ratings: number
  location_views: number
  location_comments: number
  location_media: number
  location_tips: number
  location_category_assignments: number
  user_locations: number
}

interface CleanupResult {
  success: boolean
  dryRun: boolean
  message: string
  locations: LocationToDelete[]
  totalStats: DeletionStats | null
  deletionStats: DeletionStats | null
  deletedLocations?: string[]
  failedLocations?: { name: string; error: string }[]
  error?: string
}

export default function CleanupTravelToPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CleanupResult | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handlePreview = async () => {
    setLoading(true)
    setResult(null)
    setShowConfirmation(false)

    try {
      const response = await fetch('/api/admin/cleanup-travel-to-locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dryRun: true }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        dryRun: true,
        message: 'Failed to preview cleanup',
        locations: [],
        totalStats: null,
        deletionStats: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExecute = async () => {
    setLoading(true)
    setShowConfirmation(false)

    try {
      const response = await fetch('/api/admin/cleanup-travel-to-locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dryRun: false }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        dryRun: false,
        message: 'Failed to execute cleanup',
        locations: [],
        totalStats: null,
        deletionStats: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setLoading(false)
    }
  }

  const getTotalRecords = (stats: DeletionStats | null) => {
    if (!stats) return 0
    return Object.values(stats).reduce((sum, val) => sum + val, 0)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <AdminBreadcrumb currentPage="Cleanup 'Travel to' Locations" />
        <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-2">
          🗑️ Cleanup "Travel to" Locations
        </h1>
        <p className="text-gray-600">
          Remove all locations with "Travel to" in their titles from the database
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <Database className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">What Gets Deleted</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✅ Locations - /locations cards</li>
                <li>✅ Location Ratings - User ratings</li>
                <li>✅ Location Views - Pixel tracking</li>
                <li>✅ Location Comments - Community comments</li>
                <li>✅ Location Media - User-uploaded images</li>
                <li>✅ Location Tips - User tips</li>
                <li>✅ Location Category Assignments - Categories</li>
                <li>✅ User Locations - Wishlists/customizations</li>
              </ul>
              <div className="mt-4 pt-4 border-t border-blue-200">
                <h4 className="text-sm font-semibold text-blue-900 mb-1">What Gets Preserved</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>❌ Blog Posts (location_posts) - NOT deleted</li>
                  <li>❌ Trips Library - NOT affected</li>
                  <li>❌ Private Trips - NOT affected</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex gap-4">
            <Button
              onClick={handlePreview}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              {loading && result?.dryRun !== false ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Previewing...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview (Dry Run)
                </>
              )}
            </Button>

            <Button
              onClick={() => setShowConfirmation(true)}
              disabled={loading || !result || result.locations.length === 0}
              variant="destructive"
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Execute Cleanup
            </Button>
          </div>
        </div>

        {/* Confirmation Dialog */}
        {showConfirmation && result && result.locations.length > 0 && (
          <div className="bg-red-50 border-2 border-red-500 rounded-lg p-6 mb-6">
            <div className="flex items-start mb-4">
              <AlertCircle className="h-6 w-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">⚠️ Confirm Deletion</h3>
                <p className="text-sm text-red-800 mb-4">
                  This action cannot be undone! You are about to delete:
                </p>
                <ul className="text-sm text-red-800 space-y-1 mb-4">
                  <li>• {result.locations.length} location(s)</li>
                  <li>• {getTotalRecords(result.totalStats)} total records</li>
                </ul>
                <p className="text-sm font-semibold text-red-900">
                  Are you absolutely sure you want to proceed?
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Button
                onClick={() => setShowConfirmation(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExecute}
                disabled={loading}
                variant="destructive"
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Yes, Delete Everything
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div
            className={`bg-white shadow rounded-lg p-6 border-l-4 ${
              result.success ? 'border-green-500' : 'border-red-500'
            }`}
          >
            <div className="flex items-start mb-4">
              {result.success ? (
                <CheckCircle2 className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {result.dryRun ? '🔍 Preview Results' : '✅ Cleanup Results'}
                </h3>
                <p className="text-gray-700 mb-4">{result.message}</p>

                {result.locations.length > 0 && (
                  <>
                    {/* Locations List */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">
                        Locations Found ({result.locations.length}):
                      </h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {result.locations.map((loc, index) => (
                          <div
                            key={loc.id}
                            className="bg-gray-50 rounded p-3 text-sm"
                          >
                            <div className="font-medium text-gray-900">
                              {index + 1}. {loc.name}
                            </div>
                            <div className="text-gray-600 text-xs mt-1">
                              Slug: {loc.slug} | Country: {loc.country} | 
                              Created: {new Date(loc.created_at).toLocaleDateString()} | 
                              Ratings: {loc.rating_count || 0} | Views: {loc.view_count || 0}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Statistics */}
                    {result.totalStats && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">
                          {result.dryRun ? 'Records to be Deleted:' : 'Records Deleted:'}
                        </h4>
                        <div className="bg-gray-50 rounded p-4">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>Locations: <span className="font-semibold">{result.totalStats.locations}</span></div>
                            <div>Location Ratings: <span className="font-semibold">{result.totalStats.location_ratings}</span></div>
                            <div>Location Views: <span className="font-semibold">{result.totalStats.location_views}</span></div>
                            <div>Location Comments: <span className="font-semibold">{result.totalStats.location_comments}</span></div>
                            <div>Location Media: <span className="font-semibold">{result.totalStats.location_media}</span></div>
                            <div>Location Tips: <span className="font-semibold">{result.totalStats.location_tips}</span></div>
                            <div>Category Assignments: <span className="font-semibold">{result.totalStats.location_category_assignments}</span></div>
                            <div>User Locations: <span className="font-semibold">{result.totalStats.user_locations}</span></div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-200 text-sm font-semibold">
                            TOTAL: {getTotalRecords(result.totalStats)} records
                          </div>
                          <div className="mt-2 text-xs text-gray-600">
                            ℹ️ NOTE: Blog posts (location_posts) are preserved
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Failed Locations */}
                    {result.failedLocations && result.failedLocations.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-red-900 mb-3">
                          Failed Deletions ({result.failedLocations.length}):
                        </h4>
                        <div className="space-y-2">
                          {result.failedLocations.map((failed, index) => (
                            <div key={index} className="bg-red-50 rounded p-3 text-sm">
                              <div className="font-medium text-red-900">{failed.name}</div>
                              <div className="text-red-700 text-xs mt-1">Error: {failed.error}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {result.error && (
                  <div className="bg-red-50 rounded p-3 text-sm text-red-800">
                    <strong>Error:</strong> {result.error}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

