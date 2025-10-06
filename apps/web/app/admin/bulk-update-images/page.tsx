'use client'

import { useState } from 'react'

export default function BulkUpdateImagesPage() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleBulkUpdate = async () => {
    if (!confirm('This will update ALL locations with high-quality images. This may take several minutes. Continue?')) {
      return
    }

    setIsUpdating(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch('/api/admin/bulk-update-images', {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Update failed')
      }

      setResults(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Bulk Update Images</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">High-Quality Image Update</h2>
          <p className="text-gray-600 mb-4">
            This will update all locations with:
          </p>
          <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
            <li>High-resolution featured images (2000px+)</li>
            <li>20 gallery images per location</li>
            <li>Location-specific search terms</li>
            <li>Better image quality and relevance</li>
          </ul>

          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">📝 Note:</h3>
            <p className="text-blue-800 text-sm">
              For best results, add API keys to your <code className="bg-blue-100 px-1 rounded">.env.local</code>:
            </p>
            <ul className="text-blue-800 text-sm mt-2 space-y-1">
              <li>• <strong>PEXELS_API_KEY</strong> - Get at pexels.com/api (free, unlimited)</li>
              <li>• <strong>PIXABAY_API_KEY</strong> - Get at pixabay.com/api (free, unlimited)</li>
              <li>• <strong>UNSPLASH_ACCESS_KEY</strong> - Get at unsplash.com/developers (free, 50/hour)</li>
            </ul>
            <p className="text-blue-800 text-sm mt-2">
              Without API keys, it will use Wikimedia/Wikipedia only (still good quality, but fewer images).
            </p>
          </div>

          <button
            onClick={handleBulkUpdate}
            disabled={isUpdating}
            className="bg-rausch-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-rausch-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isUpdating ? 'Updating... (this may take several minutes)' : 'Start Bulk Update'}
          </button>
        </div>

        {isUpdating && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
              <div>
                <h3 className="font-semibold text-yellow-900">Updating images...</h3>
                <p className="text-yellow-800 text-sm">This may take 5-10 minutes depending on the number of locations.</p>
                <p className="text-yellow-800 text-sm mt-1">Check the browser console for progress logs.</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-red-900 mb-2">❌ Error</h3>
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {results && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="font-semibold text-green-900 mb-4">✅ Update Complete!</h3>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded p-4 text-center">
                <div className="text-3xl font-bold text-gray-900">{results.summary.total}</div>
                <div className="text-sm text-gray-600">Total Locations</div>
              </div>
              <div className="bg-white rounded p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{results.summary.updated}</div>
                <div className="text-sm text-gray-600">Updated</div>
              </div>
              <div className="bg-white rounded p-4 text-center">
                <div className="text-3xl font-bold text-red-600">{results.summary.failed}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </div>

            <div className="bg-white rounded p-4 max-h-96 overflow-y-auto">
              <h4 className="font-semibold mb-3">Details:</h4>
              <div className="space-y-2">
                {results.results.map((result: any, index: number) => (
                  <div 
                    key={index}
                    className={`p-3 rounded ${
                      result.status === 'success' 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium">{result.location}</span>
                        {result.status === 'success' && (
                          <span className="text-sm text-gray-600 ml-2">
                            ({result.galleryCount} images)
                          </span>
                        )}
                      </div>
                      <span className={`text-sm ${
                        result.status === 'success' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {result.status === 'success' ? '✅' : '❌'}
                      </span>
                    </div>
                    {result.error && (
                      <p className="text-sm text-red-600 mt-1">{result.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 text-center">
              <a 
                href="/locations" 
                className="text-rausch-500 hover:text-rausch-600 font-semibold"
              >
                View Updated Locations →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

