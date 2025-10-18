'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function TestPlanningPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Test data
  const [testData, setTestData] = useState({
    from: 'Paris, France',
    to: 'Istanbul, Turkey',
    transportMode: 'bike',
    startDate: '2025-11-01',
    endDate: '2025-11-10',
    interests: ['art', 'food', 'history'],
    budget: 'moderate',
    proMode: true
  })

  const testItineraryGeneration = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log('🧪 TEST: Sending itinerary generation request...')
      console.log('📋 Request data:', testData)

      const response = await fetch('/api/itineraries/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: testData.from,
          to: testData.to,
          stops: [],
          startDate: testData.startDate,
          endDate: testData.endDate,
          interests: testData.interests,
          budget: testData.budget,
          transportMode: testData.transportMode,
          proMode: testData.proMode
        })
      })

      const data = await response.json()
      
      console.log('✅ TEST: Response received:', data)

      if (data.success) {
        setResult(data)
        console.log('🎯 Transport Mode in Response:', data.plan?.transportMode || 'NOT FOUND')
        console.log('🏨 Overnight Stays:', data.plan?.days?.filter((d: any) => 
          d.items?.some((i: any) => i.type === 'stay')
        ).length || 0)
        console.log('📍 POIs in Context:', data.structuredContext?.topRankedPOIs?.length || 0)
      } else {
        setError(data.error || 'Failed to generate plan')
      }
    } catch (err: any) {
      console.error('❌ TEST: Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const testPOIFetching = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log('🧪 TEST: Gathering comprehensive trip data from ALL sources...')

      // Test route: Paris to Munich (simple test)
      const testRoute = {
        from: 'Paris, France',
        to: 'Munich, Germany',
        geometry: [
          [2.3522, 48.8566], // Paris
          [3.0, 49.0],
          [4.0, 49.5],
          [5.0, 49.5],
          [6.0, 49.0],
          [7.0, 48.5],
          [8.0, 48.0],
          [9.0, 48.0],
          [10.0, 48.0],
          [11.0, 48.0],
          [11.5761, 48.1351] // Munich
        ],
        distanceKm: 685,
        durationHours: 7
      }

      // Import the comprehensive service
      const { gatherComprehensiveTripData } = await import('@/lib/services/comprehensiveTripDataService')

      const comprehensiveData = await gatherComprehensiveTripData(
        testRoute.from,
        testRoute.to,
        testRoute.geometry,
        testRoute.distanceKm,
        testRoute.durationHours
      )

      console.log('✅ TEST: Comprehensive data gathered!')
      console.log('   OpenTripMap POIs:', comprehensiveData.pois.openTripMap.length)
      console.log('   Database locations:', comprehensiveData.pois.database.length)
      console.log('   Activities:', comprehensiveData.activities.length)
      console.log('   Restaurants:', comprehensiveData.restaurants.length)
      console.log('   Facts:', comprehensiveData.facts.length)

      setResult({
        comprehensiveData,
        summary: {
          totalPOIs: comprehensiveData.pois.total,
          openTripMapPOIs: comprehensiveData.pois.openTripMap.length,
          databaseLocations: comprehensiveData.pois.database.length,
          activities: comprehensiveData.activities.length,
          restaurants: comprehensiveData.restaurants.length,
          facts: comprehensiveData.facts.length
        }
      })
    } catch (err: any) {
      console.error('❌ TEST: Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const testGroqAI = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log('🧪 TEST: Testing GROQ AI synthesis with comprehensive data...')

      // First gather comprehensive data
      const testRoute = {
        from: 'Paris, France',
        to: 'Lyon, France',
        geometry: [
          [2.3522, 48.8566], // Paris
          [2.5, 48.5],
          [3.0, 48.0],
          [3.5, 47.5],
          [4.0, 47.0],
          [4.5, 46.5],
          [4.8357, 45.7640] // Lyon
        ],
        distanceKm: 465,
        durationHours: 23 // 23 hours of biking at 20 km/h
      }

      const { gatherComprehensiveTripData } = await import('@/lib/services/comprehensiveTripDataService')

      console.log('📊 Gathering comprehensive data...')
      const comprehensiveData = await gatherComprehensiveTripData(
        testRoute.from,
        testRoute.to,
        testRoute.geometry,
        testRoute.distanceKm,
        testRoute.durationHours
      )

      console.log('🤖 Synthesizing with GROQ AI...')

      // Create context for AI
      const context = `
TRIP PLANNING DATA:
Route: ${testRoute.from} to ${testRoute.to}
Distance: ${testRoute.distanceKm} km
Transport: Bike (20 km/h average)
Duration: 3 days

AVAILABLE DATA:
- ${comprehensiveData.pois.total} POIs found along route
- ${comprehensiveData.activities.length} activities in database
- ${comprehensiveData.restaurants.length} restaurants in database
- ${comprehensiveData.locations.major.length} major cities along route

MAJOR CITIES: ${comprehensiveData.locations.major.map(l => l.name).join(', ')}

TOP POIs:
${comprehensiveData.pois.openTripMap.slice(0, 10).map(poi =>
  `- ${poi.properties?.name || 'Unnamed'} (${poi.properties?.kinds || 'unknown'})`
).join('\n')}

Generate a 3-day bike trip plan with:
1. Overnight stops (type: "stay") with accommodation suggestions
2. Daily highlights and POIs to visit
3. Realistic biking distances (max 150-180 km/day)
4. Meal breaks and rest stops
5. "Did you know?" facts for each location
`

      const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY
      if (!apiKey) {
        throw new Error('GROQ API key not found in environment variables')
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are a travel planning assistant. Use the provided data to create realistic trip plans. Return valid JSON only.'
            },
            { role: 'user', content: context }
          ],
          temperature: 0.7,
          max_tokens: 4000
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`GROQ API error: ${JSON.stringify(errorData)}`)
      }

      const data = await response.json()
      console.log('✅ TEST: GROQ response received')

      if (data.choices?.[0]?.message?.content) {
        const content = data.choices[0].message.content
        console.log('📝 AI Response:', content.substring(0, 500) + '...')

        setResult({
          comprehensiveData,
          aiResponse: content,
          summary: {
            totalPOIs: comprehensiveData.pois.total,
            activities: comprehensiveData.activities.length,
            restaurants: comprehensiveData.restaurants.length
          }
        })
      } else {
        throw new Error('No content in GROQ response')
      }
    } catch (err: any) {
      console.error('❌ TEST: Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🧪 Trip Planning Test Lab</h1>
          <p className="text-gray-600">Debug POIs, overnight stays, and AI planning features</p>
        </div>

        {/* Test Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Test Data Editor */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Test Configuration</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">From</label>
                <input
                  type="text"
                  value={testData.from}
                  onChange={(e) => setTestData({ ...testData, from: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">To</label>
                <input
                  type="text"
                  value={testData.to}
                  onChange={(e) => setTestData({ ...testData, to: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Transport Mode</label>
                <select
                  value={testData.transportMode}
                  onChange={(e) => setTestData({ ...testData, transportMode: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                >
                  <option value="car">Car</option>
                  <option value="bike">Bike</option>
                  <option value="train">Train</option>
                  <option value="flight">Flight</option>
                  <option value="bus">Bus</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={testData.proMode}
                  onChange={(e) => setTestData({ ...testData, proMode: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm font-medium text-gray-700">Pro Mode (Enhanced AI)</label>
              </div>
            </div>
          </Card>

          {/* Test Actions */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Run Tests</h2>
            <div className="space-y-3">
              <Button
                onClick={testItineraryGeneration}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? '⏳ Testing...' : '🚀 Test Full Itinerary Generation'}
              </Button>
              <Button
                onClick={testPOIFetching}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? '⏳ Testing...' : '📍 Test POI Fetching Only'}
              </Button>
              <Button
                onClick={testGroqAI}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {loading ? '⏳ Testing...' : '🤖 Test GROQ AI Directly'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="p-6 mb-8 bg-red-50 border-red-200">
            <h3 className="text-lg font-semibold text-red-900 mb-2">❌ Error</h3>
            <pre className="text-sm text-red-800 whitespace-pre-wrap">{error}</pre>
          </Card>
        )}

        {/* Results Display */}
        {result && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">✅ Test Results</h2>
            <div className="space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-xs text-blue-600 font-medium">Transport Mode</div>
                  <div className="text-lg font-bold text-blue-900">
                    {result.plan?.transportMode || result.summary?.transportMode || '❌ Missing'}
                  </div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-xs text-purple-600 font-medium">Overnight Stays</div>
                  <div className="text-lg font-bold text-purple-900">
                    {result.plan?.days?.reduce((count: number, day: any) =>
                      count + (day.items?.filter((i: any) => i.type === 'stay').length || 0), 0
                    ) || 0}
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-xs text-green-600 font-medium">POIs Found</div>
                  <div className="text-lg font-bold text-green-900">
                    {result.structuredContext?.topRankedPOIs?.length ||
                     result.summary?.totalPOIs ||
                     result.count || 0}
                  </div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-xs text-orange-600 font-medium">Total Days</div>
                  <div className="text-lg font-bold text-orange-900">
                    {result.plan?.days?.length || 0}
                  </div>
                </div>
              </div>

              {/* Comprehensive Data Summary */}
              {result.summary && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">📊 Data Sources Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    {result.summary.openTripMapPOIs !== undefined && (
                      <div>
                        <span className="text-gray-600">OpenTripMap POIs:</span>
                        <span className="ml-2 font-semibold text-blue-700">{result.summary.openTripMapPOIs}</span>
                      </div>
                    )}
                    {result.summary.databaseLocations !== undefined && (
                      <div>
                        <span className="text-gray-600">Database Locations:</span>
                        <span className="ml-2 font-semibold text-purple-700">{result.summary.databaseLocations}</span>
                      </div>
                    )}
                    {result.summary.activities !== undefined && (
                      <div>
                        <span className="text-gray-600">Activities:</span>
                        <span className="ml-2 font-semibold text-green-700">{result.summary.activities}</span>
                      </div>
                    )}
                    {result.summary.restaurants !== undefined && (
                      <div>
                        <span className="text-gray-600">Restaurants:</span>
                        <span className="ml-2 font-semibold text-orange-700">{result.summary.restaurants}</span>
                      </div>
                    )}
                    {result.summary.facts !== undefined && (
                      <div>
                        <span className="text-gray-600">Facts:</span>
                        <span className="ml-2 font-semibold text-pink-700">{result.summary.facts}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI Response (if available) */}
              {result.aiResponse && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">🤖 AI Synthesis</h3>
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap max-h-64 overflow-auto">
                    {result.aiResponse}
                  </pre>
                </div>
              )}

              {/* Full JSON Response - Collapsible */}
              <details className="border border-gray-200 rounded-lg">
                <summary className="cursor-pointer p-3 bg-gray-50 hover:bg-gray-100 rounded-lg font-medium text-sm">
                  📄 View Full JSON Response (Click to expand)
                </summary>
                <div className="p-4">
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96 text-xs">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

