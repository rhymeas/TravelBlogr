'use client'

/**
 * Route Calculation Strategy Experiment Page
 * 
 * 🎯 PURPOSE: Test different route calculation approaches to find the most efficient
 * and accurate method for generating routes with different preferences.
 * 
 * 📊 TESTING APPROACH:
 * - 5 random global locations (2-3 points each)
 * - 3 route types: Fastest, Scenic, Longest
 * - User rates each route for accuracy and quality
 * - Automated pattern analysis across all tests
 * 
 * 🔄 ROUTE TYPES:
 * - Fastest: Direct route (baseline)
 * - Scenic: Moderate detour for scenic experience (25% offset)
 * - Longest: Maximum detour for exploration (80% offset)
 * 
 * 📚 DOCUMENTATION:
 * - Results will be documented in docs/ROUTE_CALCULATION_STRATEGY.md
 * - Implementation in lib/services/routingService.ts
 */

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { MapPin, Navigation, Clock, Route as RouteIcon, Mountain, Zap } from 'lucide-react'
import { RouteComparisonMap } from '@/components/maps/RouteComparisonMap'

interface RoutePoint {
  name: string
  latitude: number
  longitude: number
}

interface RouteTestCase {
  id: string
  name: string
  category: string
  points: RoutePoint[]
  description: string
}

interface RouteResult {
  routeType: 'fastest' | 'scenic' | 'longest'
  distance: number // meters
  duration: number // seconds
  geometry: any
  provider: string
  success: boolean
  error?: string
  userRating?: 'excellent' | 'good' | 'poor' | null
  userNotes?: string
}

interface TestResult {
  testCase: RouteTestCase
  timestamp: string
  results: RouteResult[]
}

export default function RouteStrategiesTestPage() {
  // 🌍 5 DIVERSE GLOBAL TEST CASES (2-3 points each)
  const testCases: RouteTestCase[] = [
    {
      id: 'canada-rockies',
      name: 'Canadian Rockies',
      category: '🏔️ Mountain Route (Canada)',
      description: 'Vancouver → Banff',
      points: [
        { name: 'Vancouver, BC', latitude: 49.2827, longitude: -123.1207 },
        { name: 'Banff, AB', latitude: 51.1784, longitude: -115.5708 }
      ]
    },
    {
      id: 'europe-alps',
      name: 'European Alps Road Trip',
      category: '🏔️ Mountain Route (Europe)',
      description: 'Munich → Innsbruck → Zurich',
      points: [
        { name: 'Munich, Germany', latitude: 48.1351, longitude: 11.5820 },
        { name: 'Innsbruck, Austria', latitude: 47.2692, longitude: 11.4041 },
        { name: 'Zurich, Switzerland', latitude: 47.3769, longitude: 8.5417 }
      ]
    },
    {
      id: 'usa-west-coast',
      name: 'California Coast',
      category: '🌊 Coastal Route (USA)',
      description: 'San Francisco → Monterey',
      points: [
        { name: 'San Francisco, CA', latitude: 37.7749, longitude: -122.4194 },
        { name: 'Monterey, CA', latitude: 36.6002, longitude: -121.8947 }
      ]
    },
    {
      id: 'australia-outback',
      name: 'Australian Outback',
      category: '🏜️ Desert Route (Australia)',
      description: 'Sydney → Canberra → Melbourne',
      points: [
        { name: 'Sydney, Australia', latitude: -33.8688, longitude: 151.2093 },
        { name: 'Canberra, Australia', latitude: -35.2809, longitude: 149.1300 },
        { name: 'Melbourne, Australia', latitude: -37.8136, longitude: 144.9631 }
      ]
    },
    {
      id: 'japan-scenic',
      name: 'Japan Scenic Route',
      category: '🗾 Island Route (Japan)',
      description: 'Tokyo → Mount Fuji → Kyoto',
      points: [
        { name: 'Tokyo, Japan', latitude: 35.6762, longitude: 139.6503 },
        { name: 'Mount Fuji, Japan', latitude: 35.3606, longitude: 138.7274 },
        { name: 'Kyoto, Japan', latitude: 35.0116, longitude: 135.7681 }
      ]
    },
    {
      id: 'south-africa',
      name: 'South African Garden Route',
      category: '🦁 Safari Route (South Africa)',
      description: 'Cape Town → Garden Route → Port Elizabeth',
      points: [
        { name: 'Cape Town, South Africa', latitude: -33.9249, longitude: 18.4241 },
        { name: 'Knysna, South Africa', latitude: -34.0364, longitude: 23.0471 },
        { name: 'Port Elizabeth, South Africa', latitude: -33.9608, longitude: 25.6022 }
      ]
    }
  ]

  const [selectedTestCase, setSelectedTestCase] = useState(0)
  const [results, setResults] = useState<RouteResult[]>([])
  const [loading, setLoading] = useState(false)
  const [allTestResults, setAllTestResults] = useState<TestResult[]>([])
  const [showAnalysis, setShowAnalysis] = useState(false)

  // Test all 3 route types for selected test case
  const testAllRouteTypes = async () => {
    setLoading(true)
    setResults([])

    const testCase = testCases[selectedTestCase]
    const routeTypes: Array<'fastest' | 'scenic' | 'longest'> = ['fastest', 'scenic', 'longest']
    const newResults: RouteResult[] = []

    console.log('\n🧪 ========================================')
    console.log(`🧪 TESTING: ${testCase.name}`)
    console.log(`🧪 Route: ${testCase.description}`)
    console.log('🧪 ========================================\n')

    for (const routeType of routeTypes) {
      try {
        console.log(`\n🔍 Testing ${routeType.toUpperCase()} route...`)

        // Convert points to coordinates format
        const coordinates = testCase.points.map(p => ({
          latitude: p.latitude,
          longitude: p.longitude
        }))

        console.log(`📍 Coordinates:`, coordinates.map(c => `${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`))

        // Call routing API with cache-busting timestamp
        const response = await fetch('/api/routing/get-route', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coordinates,
            profile: 'driving-car',
            preference: routeType,
            bustCache: true // Force fresh calculation
          })
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()

        newResults.push({
          routeType,
          distance: data.distance,
          duration: data.duration,
          geometry: data.geometry,
          provider: data.provider,
          success: true,
          userRating: null
        })

        console.log(`✅ ${routeType}: ${(data.distance / 1000).toFixed(1)}km, ${(data.duration / 60).toFixed(0)}min`)
      } catch (error) {
        console.error(`❌ ${routeType} failed:`, error)
        newResults.push({
          routeType,
          distance: 0,
          duration: 0,
          geometry: null,
          provider: 'error',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          userRating: null
        })
      }
    }

    setResults(newResults)
    setLoading(false)
  }

  // Rate a specific route
  const rateRoute = (index: number, rating: 'excellent' | 'good' | 'poor' | null, notes?: string) => {
    setResults(prev => prev.map((r, i) =>
      i === index ? { ...r, userRating: rating, userNotes: notes } : r
    ))
  }

  // Save ratings and add to accumulated results
  const saveRatings = () => {
    const testRecord: TestResult = {
      testCase: testCases[selectedTestCase],
      timestamp: new Date().toISOString(),
      results: results
    }

    setAllTestResults(prev => [...prev, testRecord])

    console.log('\n📊 RATINGS SAVED:')
    console.log(JSON.stringify(testRecord, null, 2))
    console.log('\n📈 Total test cases logged:', allTestResults.length + 1)

    navigator.clipboard.writeText(JSON.stringify(testRecord, null, 2))
    alert(`✅ Ratings saved! Total test cases: ${allTestResults.length + 1}. Click "View Analysis" to see patterns.`)
  }

  // Analyze patterns across all tests
  const analyzePatterns = () => {
    if (allTestResults.length === 0) {
      alert('No test results yet! Run some tests first.')
      return
    }

    const analysis = {
      totalTests: allTestResults.length,
      routeTypes: {} as Record<string, {
        totalTests: number
        excellent: number
        good: number
        poor: number
        avgDistance: number
        avgDuration: number
        successRate: number
      }>
    }

    // Aggregate data by route type
    allTestResults.forEach(test => {
      test.results.forEach(result => {
        if (!analysis.routeTypes[result.routeType]) {
          analysis.routeTypes[result.routeType] = {
            totalTests: 0,
            excellent: 0,
            good: 0,
            poor: 0,
            avgDistance: 0,
            avgDuration: 0,
            successRate: 0
          }
        }

        const rt = analysis.routeTypes[result.routeType]
        rt.totalTests++

        if (result.userRating === 'excellent') rt.excellent++
        else if (result.userRating === 'good') rt.good++
        else if (result.userRating === 'poor') rt.poor++

        if (result.success) {
          rt.successRate++
          rt.avgDistance += result.distance
          rt.avgDuration += result.duration
        }
      })
    })

    // Calculate averages
    Object.keys(analysis.routeTypes).forEach(key => {
      const rt = analysis.routeTypes[key]
      rt.successRate = (rt.successRate / rt.totalTests) * 100
      rt.avgDistance = rt.avgDistance / rt.totalTests
      rt.avgDuration = rt.avgDuration / rt.totalTests
    })

    console.log('\n🔍 PATTERN ANALYSIS:')
    console.log(JSON.stringify(analysis, null, 2))

    setShowAnalysis(true)
  }

  // Format distance
  const formatDistance = (meters: number) => {
    return `${(meters / 1000).toFixed(1)} km`
  }

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  // Get route type icon
  const getRouteIcon = (type: string) => {
    switch (type) {
      case 'fastest': return <Zap className="h-4 w-4" />
      case 'scenic': return <Mountain className="h-4 w-4" />
      case 'longest': return <RouteIcon className="h-4 w-4" />
      default: return <RouteIcon className="h-4 w-4" />
    }
  }

  // Get route type color
  const getRouteColor = (type: string) => {
    switch (type) {
      case 'fastest': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'scenic': return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'longest': return 'text-orange-600 bg-orange-50 border-orange-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Route Calculation Strategy Experiment
          </h1>
          <p className="text-gray-600">
            Test different route calculation approaches across global locations
          </p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>V3 Strategy:</strong> Testing waypoint detour approach with 3 route types (Fastest, Scenic 25%, Longest 80%)
            </p>
          </div>
        </div>

        {/* Test Case Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Select Test Case</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {testCases.map((tc, index) => (
              <button
                key={tc.id}
                onClick={() => {
                  setSelectedTestCase(index)
                  setResults([])
                }}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedTestCase === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="font-semibold text-gray-900 mb-1">{tc.category}</div>
                <div className="text-sm text-gray-600 mb-2">{tc.name}</div>
                <div className="text-xs text-gray-500">{tc.description}</div>
                <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                  <MapPin className="h-3 w-3" />
                  {tc.points.length} points
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6">
            <Button
              onClick={testAllRouteTypes}
              disabled={loading}
              className="w-full md:w-auto"
            >
              {loading ? '🔄 Testing Routes...' : '🚀 Test All 3 Route Types'}
            </Button>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                📊 Results ({results.filter(r => r.success).length}/3 successful)
              </h2>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Rated: {results.filter(r => r.userRating).length}/3
                </div>
                {allTestResults.length > 0 && (
                  <div className="text-sm font-semibold text-blue-600">
                    📈 {allTestResults.length} test{allTestResults.length > 1 ? 's' : ''} logged
                  </div>
                )}
                <Button
                  onClick={analyzePatterns}
                  disabled={allTestResults.length === 0}
                  variant="outline"
                  size="sm"
                >
                  🔍 View Analysis
                </Button>
                <Button
                  onClick={saveRatings}
                  disabled={results.filter(r => r.userRating).length === 0}
                  variant="outline"
                  size="sm"
                >
                  💾 Save Ratings
                </Button>
              </div>
            </div>

            {/* Quick Comparison Summary with Maps */}
            {results.length === 3 && results.every(r => r.success) && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6 border border-blue-200">
                <h3 className="font-bold text-gray-900 mb-3">🎯 Visual Route Comparison</h3>
                <div className="grid grid-cols-3 gap-4">
                  {/* Fastest */}
                  {(() => {
                    const fastest = results.find(r => r.routeType === 'fastest')!
                    const coords = fastest.geometry.coordinates

                    // Get start and end points
                    const startCoord = coords[0]
                    const endCoord = coords[coords.length - 1]

                    // Calculate route visualization
                    const totalPoints = coords.length
                    const samplePoints = coords.filter((_: any, i: number) => i % Math.floor(totalPoints / 20) === 0)

                    return (
                      <div className="bg-white rounded-lg overflow-hidden border border-blue-200">
                        <RouteComparisonMap
                          geometry={fastest.geometry}
                          color="#3b82f6"
                          height="192px"
                        />
                        <div className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold text-blue-900">Fastest</span>
                          </div>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Distance:</span>
                              <span className="font-medium">{formatDistance(fastest.distance)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Time:</span>
                              <span className="font-medium">{formatDuration(fastest.duration)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Scenic */}
                  {(() => {
                    const scenic = results.find(r => r.routeType === 'scenic')!

                    return (
                      <div className="bg-white rounded-lg overflow-hidden border border-purple-200">
                        <RouteComparisonMap
                          geometry={scenic.geometry}
                          color="#9333ea"
                          height="192px"
                        />
                        <div className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Mountain className="h-4 w-4 text-purple-600" />
                            <span className="font-semibold text-purple-900">Scenic</span>
                          </div>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Distance:</span>
                              <span className="font-medium">{formatDistance(scenic.distance)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Time:</span>
                              <span className="font-medium">{formatDuration(scenic.duration)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">vs Fastest:</span>
                              <span className="font-medium text-purple-600">
                                +{formatDistance(scenic.distance - results.find(r => r.routeType === 'fastest')!.distance)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Longest */}
                  {(() => {
                    const longest = results.find(r => r.routeType === 'longest')!

                    return (
                      <div className="bg-white rounded-lg overflow-hidden border border-orange-200">
                        <RouteComparisonMap
                          geometry={longest.geometry}
                          color="#f97316"
                          height="192px"
                        />
                        <div className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <RouteIcon className="h-4 w-4 text-orange-600" />
                            <span className="font-semibold text-orange-900">Longest</span>
                          </div>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Distance:</span>
                              <span className="font-medium">{formatDistance(longest.distance)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Time:</span>
                              <span className="font-medium">{formatDuration(longest.duration)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">vs Fastest:</span>
                              <span className="font-medium text-orange-600">
                                +{formatDistance(longest.distance - results.find(r => r.routeType === 'fastest')!.distance)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {/* Differentiation Check */}
                <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                  <div className="text-sm">
                    <span className="font-semibold text-gray-900">Route Differentiation:</span>
                    {(() => {
                      const fastest = results.find(r => r.routeType === 'fastest')!
                      const scenic = results.find(r => r.routeType === 'scenic')!
                      const longest = results.find(r => r.routeType === 'longest')!

                      const fastestVsScenic = Math.abs(fastest.distance - scenic.distance) / 1000
                      const fastestVsLongest = Math.abs(fastest.distance - longest.distance) / 1000
                      const scenicVsLongest = Math.abs(scenic.distance - longest.distance) / 1000

                      const allSame = fastestVsScenic < 1 && fastestVsLongest < 1 && scenicVsLongest < 1
                      const wellDifferentiated = fastestVsScenic > 10 && fastestVsLongest > 10

                      return (
                        <div className="ml-2">
                          <span className={`font-medium ${
                            allSame ? 'text-red-600' : wellDifferentiated ? 'text-green-600' : 'text-orange-600'
                          }`}>
                            {allSame ? '❌ All routes are the same!' :
                             wellDifferentiated ? '✅ Routes are well differentiated' :
                             '⚠️ Routes are similar'}
                          </span>
                          <div className="mt-2 text-xs text-gray-600 space-y-1">
                            <div>Fastest → Scenic: +{fastestVsScenic.toFixed(1)}km</div>
                            <div>Fastest → Longest: +{fastestVsLongest.toFixed(1)}km</div>
                            <div>Scenic → Longest: +{scenicVsLongest.toFixed(1)}km</div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`border-2 rounded-lg p-6 ${
                    result.userRating === 'excellent' ? 'border-green-300 bg-green-50' :
                    result.userRating === 'good' ? 'border-blue-300 bg-blue-50' :
                    result.userRating === 'poor' ? 'border-red-300 bg-red-50' :
                    'border-gray-200'
                  }`}
                >
                  {/* Route Type Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg border ${getRouteColor(result.routeType)}`}>
                        {getRouteIcon(result.routeType)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 capitalize">
                          {result.routeType} Route
                        </h3>
                        <p className="text-sm text-gray-500">
                          Provider: {result.provider}
                        </p>
                      </div>
                    </div>

                    {/* Rating Buttons */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 mr-2">Rate:</span>
                      <button
                        onClick={() => rateRoute(index, result.userRating === 'excellent' ? null : 'excellent')}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          result.userRating === 'excellent'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-green-100'
                        }`}
                      >
                        ✓✓ Excellent
                      </button>
                      <button
                        onClick={() => rateRoute(index, result.userRating === 'good' ? null : 'good')}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          result.userRating === 'good'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-blue-100'
                        }`}
                      >
                        ✓ Good
                      </button>
                      <button
                        onClick={() => rateRoute(index, result.userRating === 'poor' ? null : 'poor')}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          result.userRating === 'poor'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-red-100'
                        }`}
                      >
                        ✗ Poor
                      </button>
                    </div>
                  </div>

                  {/* Route Stats */}
                  {result.success ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="text-xs text-gray-500 mb-1">Distance</div>
                          <div className="text-lg font-bold text-gray-900">
                            {formatDistance(result.distance)}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="text-xs text-gray-500 mb-1">Duration</div>
                          <div className="text-lg font-bold text-gray-900">
                            {formatDuration(result.duration)}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="text-xs text-gray-500 mb-1">Avg Speed</div>
                          <div className="text-lg font-bold text-gray-900">
                            {((result.distance / 1000) / (result.duration / 3600)).toFixed(0)} km/h
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="text-xs text-gray-500 mb-1">Route Points</div>
                          <div className="text-lg font-bold text-gray-900">
                            {result.geometry?.coordinates?.length || 0}
                          </div>
                        </div>
                      </div>

                      {/* Comparison with other routes */}
                      {results.length === 3 && (
                        <div className="bg-gray-50 rounded-lg p-3 text-xs">
                          <div className="font-medium text-gray-700 mb-2">📊 Comparison:</div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <span className="text-gray-600">vs Fastest:</span>{' '}
                              <span className={`font-medium ${
                                result.distance > results.find(r => r.routeType === 'fastest')!.distance
                                  ? 'text-red-600'
                                  : result.distance < results.find(r => r.routeType === 'fastest')!.distance
                                  ? 'text-green-600'
                                  : 'text-gray-600'
                              }`}>
                                {result.routeType === 'fastest' ? '—' :
                                  `${((result.distance - results.find(r => r.routeType === 'fastest')!.distance) / 1000).toFixed(1)}km`
                                }
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">vs Scenic:</span>{' '}
                              <span className={`font-medium ${
                                result.distance > results.find(r => r.routeType === 'scenic')!.distance
                                  ? 'text-red-600'
                                  : result.distance < results.find(r => r.routeType === 'scenic')!.distance
                                  ? 'text-green-600'
                                  : 'text-gray-600'
                              }`}>
                                {result.routeType === 'scenic' ? '—' :
                                  `${((result.distance - results.find(r => r.routeType === 'scenic')!.distance) / 1000).toFixed(1)}km`
                                }
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">vs Longest:</span>{' '}
                              <span className={`font-medium ${
                                result.distance > results.find(r => r.routeType === 'longest')!.distance
                                  ? 'text-red-600'
                                  : result.distance < results.find(r => r.routeType === 'longest')!.distance
                                  ? 'text-green-600'
                                  : 'text-gray-600'
                              }`}>
                                {result.routeType === 'longest' ? '—' :
                                  `${((result.distance - results.find(r => r.routeType === 'longest')!.distance) / 1000).toFixed(1)}km`
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800 font-medium">❌ Route calculation failed</p>
                      <p className="text-sm text-red-600 mt-1">{result.error}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis Modal */}
        {showAnalysis && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">📊 Pattern Analysis</h2>
                  <button
                    onClick={() => setShowAnalysis(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕ Close
                  </button>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-blue-600 mb-1">Total Tests</div>
                    <div className="text-2xl font-bold text-blue-900">{allTestResults.length}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-green-600 mb-1">Route Types</div>
                    <div className="text-2xl font-bold text-green-900">3</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-sm text-purple-600 mb-1">Total Ratings</div>
                    <div className="text-2xl font-bold text-purple-900">
                      {allTestResults.reduce((sum, t) => sum + t.results.filter(r => r.userRating).length, 0)}
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="text-sm text-orange-600 mb-1">Locations</div>
                    <div className="text-2xl font-bold text-orange-900">
                      {new Set(allTestResults.map(t => t.testCase.id)).size}
                    </div>
                  </div>
                </div>

                {/* Test Cases List */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Test Cases</h3>
                  <div className="space-y-2">
                    {allTestResults.map((test, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm">
                        <div className="font-medium text-gray-900">{test.testCase.category}</div>
                        <div className="text-gray-600">{test.testCase.description}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(test.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Route Type Rankings */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Route Type Performance</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Route Type</th>
                          <th className="px-4 py-2 text-center">Tests</th>
                          <th className="px-4 py-2 text-center">Success Rate</th>
                          <th className="px-4 py-2 text-center">Excellent</th>
                          <th className="px-4 py-2 text-center">Good</th>
                          <th className="px-4 py-2 text-center">Poor</th>
                          <th className="px-4 py-2 text-right">Avg Distance</th>
                          <th className="px-4 py-2 text-right">Avg Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(
                          allTestResults.reduce((acc, test) => {
                            test.results.forEach(r => {
                              if (!acc[r.routeType]) {
                                acc[r.routeType] = {
                                  totalTests: 0,
                                  excellent: 0,
                                  good: 0,
                                  poor: 0,
                                  avgDistance: 0,
                                  avgDuration: 0,
                                  successRate: 0
                                }
                              }
                              const rt = acc[r.routeType]
                              rt.totalTests++
                              if (r.userRating === 'excellent') rt.excellent++
                              else if (r.userRating === 'good') rt.good++
                              else if (r.userRating === 'poor') rt.poor++
                              if (r.success) {
                                rt.successRate++
                                rt.avgDistance += r.distance
                                rt.avgDuration += r.duration
                              }
                            })
                            return acc
                          }, {} as Record<string, any>)
                        ).map(([type, data]) => {
                          const successRate = (data.successRate / data.totalTests) * 100
                          const avgDist = data.avgDistance / data.totalTests
                          const avgDur = data.avgDuration / data.totalTests
                          const score = (data.excellent * 3 + data.good * 1) / data.totalTests

                          return (
                            <tr key={type} className="border-t border-gray-200">
                              <td className="px-4 py-3 font-medium capitalize">{type}</td>
                              <td className="px-4 py-3 text-center">{data.totalTests}</td>
                              <td className="px-4 py-3 text-center">{successRate.toFixed(0)}%</td>
                              <td className="px-4 py-3 text-center text-green-600">{data.excellent}</td>
                              <td className="px-4 py-3 text-center text-blue-600">{data.good}</td>
                              <td className="px-4 py-3 text-center text-red-600">{data.poor}</td>
                              <td className="px-4 py-3 text-right">{formatDistance(avgDist)}</td>
                              <td className="px-4 py-3 text-right">{formatDuration(avgDur)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

