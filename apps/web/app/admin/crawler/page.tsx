'use client'

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic'

/**
 * Admin Crawler Dashboard
 * Interface to manually trigger crawlers and view stats
 */

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Loader2, Cloud, UtensilsCrossed, AlertCircle, CheckCircle2 } from 'lucide-react'
import { AdminBreadcrumb } from '@/components/admin/AdminNav'

interface CrawlerResult {
  success: boolean
  message: string
  data?: any
  error?: string
}

export default function CrawlerAdminPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CrawlerResult | null>(null)
  const [locationId, setLocationId] = useState('')
  const [restaurantUrls, setRestaurantUrls] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')

  const triggerWeatherSync = async () => {
    if (!locationId || !latitude || !longitude) {
      setResult({
        success: false,
        message: 'Please fill in all weather fields',
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/crawler/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_SECRET || 'dev-secret'}`,
        },
        body: JSON.stringify({
          type: 'weather',
          locationId,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to trigger weather sync',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setLoading(false)
    }
  }

  const triggerRestaurantCrawl = async () => {
    if (!locationId || !restaurantUrls) {
      setResult({
        success: false,
        message: 'Please fill in all restaurant fields',
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const urls = restaurantUrls
        .split('\n')
        .map((url) => url.trim())
        .filter((url) => url.length > 0)

      const response = await fetch('/api/admin/crawler/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_SECRET || 'dev-secret'}`,
        },
        body: JSON.stringify({
          type: 'restaurants',
          locationId,
          urls,
        }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to trigger restaurant crawl',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setLoading(false)
    }
  }

  const triggerFullWeatherSync = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/cron/sync-weather', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_SECRET || 'dev-secret'}`,
        },
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to trigger full weather sync',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <AdminBreadcrumb currentPage="Crawler" />
        <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-2">
          Content Crawler Dashboard
        </h1>
        <p className="text-gray-600">
          Manually trigger crawlers to fetch restaurant data and weather information
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Weather Sync Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <Cloud className="h-6 w-6 text-blue-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Weather Sync</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location ID
              </label>
              <input
                type="text"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rausch-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g., 51.1784"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rausch-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g., -115.5708"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rausch-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={triggerWeatherSync}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Cloud className="h-4 w-4 mr-2" />
                    Sync Weather for Location
                  </>
                )}
              </Button>

              <Button
                onClick={triggerFullWeatherSync}
                disabled={loading}
                variant="secondary"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  'Sync All Locations'
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Restaurant Crawler Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <UtensilsCrossed className="h-6 w-6 text-rausch-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Restaurant Crawler</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Restaurant URLs (one per line)
              </label>
              <textarea
                value={restaurantUrls}
                onChange={(e) => setRestaurantUrls(e.target.value)}
                placeholder="https://restaurant1.com&#10;https://restaurant2.com&#10;https://restaurant3.com"
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rausch-500 font-mono text-sm"
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter restaurant website URLs. The crawler will extract structured data.
              </p>
            </div>

            <Button
              onClick={triggerRestaurantCrawl}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Crawling...
                </>
              ) : (
                <>
                  <UtensilsCrossed className="h-4 w-4 mr-2" />
                  Crawl Restaurants
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Result Display */}
        {result && (
          <div
            className={`bg-white shadow rounded-lg p-6 border-l-4 ${
              result.success ? 'border-green-500' : 'border-red-500'
            }`}
          >
            <div className="flex items-start">
              {result.success ? (
                <CheckCircle2 className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h3
                  className={`text-lg font-semibold mb-2 ${
                    result.success ? 'text-green-900' : 'text-red-900'
                  }`}
                >
                  {result.success ? 'Success' : 'Error'}
                </h3>
                <p className="text-gray-700 mb-2">{result.message}</p>
                {result.data && (
                  <pre className="mt-3 p-3 bg-gray-50 rounded text-xs overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
                {result.error && (
                  <p className="mt-2 text-sm text-red-600">{result.error}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

