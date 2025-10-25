'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface TestResult {
  step: string
  status: 'pending' | 'success' | 'error'
  message: string
  data?: any
  duration?: number
}

export default function LocationCreationDebugPage() {
  const [locationName, setLocationName] = useState('Banff National Park')
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addResult = (step: string, status: 'pending' | 'success' | 'error', message: string, data?: any, duration?: number) => {
    setResults(prev => [...prev, { step, status, message, data, duration }])
  }

  const runFullTest = async () => {
    setResults([])
    setIsRunning(true)

    try {
      // Step 1: Create location via auto-fill
      addResult('Auto-fill Location', 'pending', 'Creating location...')
      const startTime = Date.now()
      
      const autoFillRes = await fetch('/api/admin/auto-fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationName })
      })

      const autoFillData = await autoFillRes.json()
      const duration1 = Date.now() - startTime

      if (autoFillData.success) {
        addResult('Auto-fill Location', 'success', `Location created: ${autoFillData.location.name}`, autoFillData, duration1)
      } else {
        addResult('Auto-fill Location', 'error', autoFillData.error, autoFillData, duration1)
        setIsRunning(false)
        return
      }

      // Step 2: Fetch location from database
      addResult('Fetch from Database', 'pending', 'Fetching location...')
      const startTime2 = Date.now()

      const slug = autoFillData.location.slug
      const dbRes = await fetch(`/api/locations/${slug}`)
      const dbData = await dbRes.json()
      const duration2 = Date.now() - startTime2

      if (dbData.success) {
        const location = dbData.data
        addResult('Fetch from Database', 'success', `Location fetched`, {
          id: location.id,
          name: location.name,
          featured_image: location.featured_image ? '✓' : '✗',
          gallery_images_count: location.gallery_images?.length || 0,
          activities_count: location.activities?.length || 0,
          restaurants_count: location.restaurants?.length || 0
        }, duration2)

        // Step 3: Check image quality
        if (location.featured_image) {
          addResult('Featured Image', 'success', `URL: ${location.featured_image.substring(0, 50)}...`, {
            url: location.featured_image,
            isValid: location.featured_image.startsWith('http')
          })
        } else {
          addResult('Featured Image', 'error', 'No featured image found', {})
        }

        // Step 4: Check gallery images
        if (location.gallery_images && location.gallery_images.length > 0) {
          addResult('Gallery Images', 'success', `${location.gallery_images.length} images found`, {
            count: location.gallery_images.length,
            samples: location.gallery_images.slice(0, 3)
          })
        } else {
          addResult('Gallery Images', 'error', 'No gallery images found', {})
        }

        // Step 5: Verify location detail page loads
        addResult('Location Detail Page', 'pending', 'Loading detail page...')
        const startTime3 = Date.now()

        const pageRes = await fetch(`/locations/${slug}`)
        const duration3 = Date.now() - startTime3

        if (pageRes.ok) {
          addResult('Location Detail Page', 'success', `Page loaded successfully`, { status: pageRes.status }, duration3)
        } else {
          addResult('Location Detail Page', 'error', `Page failed to load: ${pageRes.status}`, { status: pageRes.status }, duration3)
        }

      } else {
        addResult('Fetch from Database', 'error', dbData.error, dbData, duration2)
      }

    } catch (error) {
      addResult('Test Error', 'error', error instanceof Error ? error.message : 'Unknown error', { error })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">🐛 Location Creation Debug</h1>
        <p className="text-gray-600 mb-8">Test the full workflow from location creation to image display</p>

        <Card className="p-6 mb-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Location Name</label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter location name"
              />
            </div>
            <Button
              onClick={runFullTest}
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? 'Running Test...' : 'Run Full Test'}
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          {results.map((result, idx) => (
            <Card key={idx} className={`p-4 border-l-4 ${
              result.status === 'success' ? 'border-l-green-500 bg-green-50' :
              result.status === 'error' ? 'border-l-red-500 bg-red-50' :
              'border-l-blue-500 bg-blue-50'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{result.step}</h3>
                  <p className="text-sm text-gray-700 mt-1">{result.message}</p>
                  {result.duration && (
                    <p className="text-xs text-gray-500 mt-1">⏱️ {result.duration}ms</p>
                  )}
                </div>
                <span className={`text-2xl ${
                  result.status === 'success' ? '✅' :
                  result.status === 'error' ? '❌' :
                  '⏳'
                }`}></span>
              </div>
              {result.data && (
                <pre className="mt-3 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

