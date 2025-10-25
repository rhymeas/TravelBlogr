'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Mountain, Clock, CheckCircle, XCircle } from 'lucide-react'

interface ImageResult {
  activity: string
  location: string
  status: 'loading' | 'success' | 'error'
  imageUrl?: string
  source?: string
  error?: string
  fetchTime?: number
}

export default function TestActivityImagesPage() {
  const [results, setResults] = useState<ImageResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const testActivities = [
    { activity: 'Domfelsen', location: 'Magdeburg, Germany' },
    { activity: 'Eiffel Tower', location: 'Paris, France' },
    { activity: 'Colosseum', location: 'Rome, Italy' },
    { activity: 'Big Ben', location: 'London, UK' },
    { activity: 'Statue of Liberty', location: 'New York, USA' },
    { activity: 'Brandenburg Gate', location: 'Berlin, Germany' },
    { activity: 'Sagrada Familia', location: 'Barcelona, Spain' },
    { activity: 'Taj Mahal', location: 'Agra, India' },
    { activity: 'Random XYZ123', location: 'Nowhere, Antarctica' }, // Should fail
  ]

  const runTest = async () => {
    setIsRunning(true)
    setResults([])

    for (const test of testActivities) {
      // Add loading state
      setResults(prev => [...prev, {
        activity: test.activity,
        location: test.location,
        status: 'loading'
      }])

      const startTime = Date.now()

      try {
        const response = await fetch(
          `/api/activities/find-image?activityName=${encodeURIComponent(test.activity)}&locationName=${encodeURIComponent(test.location)}`
        )
        const data = await response.json()
        const fetchTime = Date.now() - startTime

        setResults(prev => prev.map(r => 
          r.activity === test.activity && r.location === test.location
            ? {
                ...r,
                status: data.success ? 'success' : 'error',
                imageUrl: data.url,
                source: data.source || 'Unknown',
                fetchTime,
                error: data.error
              }
            : r
        ))
      } catch (error: any) {
        const fetchTime = Date.now() - startTime
        setResults(prev => prev.map(r => 
          r.activity === test.activity && r.location === test.location
            ? {
                ...r,
                status: 'error',
                error: error.message,
                fetchTime
              }
            : r
        ))
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    setIsRunning(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold mb-3">Activity Image Fetching Test</h1>
          <p className="text-gray-600 text-sm mb-4">
            Tests image fetching with timeouts: <strong>Brave API</strong> (2s) → <strong>Reddit</strong> → <strong>Pexels</strong> (3s) → <strong>Unsplash</strong> (3s) → <strong>Wikipedia</strong> → <strong>Placeholder</strong>
          </p>

          <button
            onClick={runTest}
            disabled={isRunning}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {isRunning ? 'Running Tests...' : 'Run Image Fetch Test'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((result, index) => (
              <div key={index} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                {/* Image Preview */}
                <div className="aspect-video relative rounded-t-lg overflow-hidden bg-gray-100">
                  {result.status === 'loading' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  {result.status === 'success' && result.imageUrl && (
                    <Image
                      src={result.imageUrl}
                      alt={result.activity}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        console.error('Image failed to load:', result.imageUrl)
                      }}
                    />
                  )}
                  {result.status === 'error' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                      <Mountain className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-4">
                  <h3 className="font-bold text-sm mb-1 truncate">{result.activity}</h3>
                  <p className="text-gray-500 text-xs mb-3 truncate">{result.location}</p>

                  <div className="space-y-2">
                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      {result.status === 'loading' && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          <Clock className="h-3 w-3" />
                          Fetching...
                        </span>
                      )}
                      {result.status === 'success' && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3" />
                          {result.fetchTime}ms
                        </span>
                      )}
                      {result.status === 'error' && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <XCircle className="h-3 w-3" />
                          Failed
                        </span>
                      )}

                      {/* Source Badge */}
                      {result.source && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          {result.source}
                        </span>
                      )}
                    </div>

                    {/* Image URL (truncated) */}
                    {result.imageUrl && (
                      <a
                        href={result.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-xs truncate block"
                        title={result.imageUrl}
                      >
                        {result.imageUrl.substring(0, 50)}...
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {results.length === 0 && !isRunning && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Mountain className="h-16 w-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Click "Run Image Fetch Test" to start</p>
          </div>
        )}
      </div>
    </div>
  )
}

