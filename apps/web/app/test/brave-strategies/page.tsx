'use client'

/**
 * Brave API Query Strategy Experiment Page
 * 
 * Purpose: Test different query strategies to find the most accurate approach
 * for fetching POI/activity images from Brave Search API.
 * 
 * Hypothesis: Query specificity and geographic hierarchy affect image accuracy.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import Image from 'next/image'

interface TestResult {
  strategy: string
  query: string
  images: Array<{
    thumbnail: string
    url: string
    title: string
    source: string
  }>
  success: boolean
  imageCount: number
  userRating?: 'excellent' | 'good' | 'poor' | null
}

export default function BraveStrategiesTestPage() {
  // Predefined test cases for diverse testing
  const testCases = [
    { name: 'Kicking Horse Mountain Resort', location: 'Golden, BC', type: 'ski resort', category: '🎿 Ski Resort (Canada)' },
    { name: 'Sun Peaks Resort', location: 'Kamloops, BC', type: 'ski resort', category: '🎿 Ski Resort (Canada)' },
    { name: 'Eiffel Tower', location: 'Paris, France', type: 'landmark', category: '🗼 Famous Landmark' },
    { name: 'Taj Mahal', location: 'Agra, India', type: 'monument', category: '🕌 Monument (India)' },
    { name: 'Bondi Beach', location: 'Sydney, Australia', type: 'beach', category: '🏖️ Beach (Australia)' },
    { name: 'Central Park', location: 'New York, USA', type: 'park', category: '🌳 Park (USA)' },
    { name: 'Gondola Ride', location: 'Venice, Italy', type: 'activity', category: '🚣 Activity (Italy)' },
    { name: 'Louvre Museum', location: 'Paris, France', type: 'museum', category: '🎨 Museum (France)' },
    { name: 'Inca Trail', location: 'Cusco, Peru', type: 'hiking trail', category: '🥾 Hiking (Peru)' },
    { name: 'Burj Khalifa', location: 'Dubai, UAE', type: 'skyscraper', category: '🏙️ Skyscraper (UAE)' },
  ]

  const [activityName, setActivityName] = useState('Kicking Horse Mountain Resort')
  const [location, setLocation] = useState('Golden, BC')
  const [activityType, setActivityType] = useState('ski resort')
  const [selectedTestCase, setSelectedTestCase] = useState(0)
  const [results, setResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(false)
  const [allTestResults, setAllTestResults] = useState<Array<{
    testCase: string
    activityName: string
    location: string
    type: string
    timestamp: string
    results: TestResult[]
  }>>([])
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [selectedStrategy, setSelectedStrategy] = useState<number | null>(null)

  // Rating handler
  const rateStrategy = (index: number, rating: 'excellent' | 'good' | 'poor' | null) => {
    setResults(prev => prev.map((r, i) =>
      i === index ? { ...r, userRating: rating } : r
    ))
  }

  // Export ratings for analysis
  const exportRatings = () => {
    const ratingsData = results.map((r, i) => ({
      strategy: r.strategy,
      query: r.query,
      imageCount: r.imageCount,
      rating: r.userRating || 'not_rated',
      success: r.success
    }))

    // Save to accumulated results
    const testRecord = {
      testCase: testCases[selectedTestCase]?.category || 'Custom',
      activityName,
      location,
      type: activityType,
      timestamp: new Date().toISOString(),
      results: results
    }

    setAllTestResults(prev => [...prev, testRecord])

    console.log('\n📊 RATINGS SAVED:')
    console.log(JSON.stringify(ratingsData, null, 2))
    console.log('\n📈 Total test cases logged:', allTestResults.length + 1)

    // Copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(ratingsData, null, 2))
    alert(`✅ Ratings saved! Total test cases: ${allTestResults.length + 1}. Click "View Analysis" to see patterns.`)
  }

  const analyzePatterns = () => {
    if (allTestResults.length === 0) {
      alert('No test results yet! Run some tests first.')
      return
    }

    // Analyze patterns across all tests
    const analysis = {
      totalTests: allTestResults.length,
      strategies: {} as Record<string, {
        totalTests: number
        excellent: number
        good: number
        poor: number
        notRated: number
        successRate: number
        avgImageCount: number
      }>
    }

    // Aggregate data by strategy
    allTestResults.forEach(test => {
      test.results.forEach(result => {
        if (!analysis.strategies[result.strategy]) {
          analysis.strategies[result.strategy] = {
            totalTests: 0,
            excellent: 0,
            good: 0,
            poor: 0,
            notRated: 0,
            successRate: 0,
            avgImageCount: 0
          }
        }

        const strat = analysis.strategies[result.strategy]
        strat.totalTests++

        if (result.userRating === 'excellent') strat.excellent++
        else if (result.userRating === 'good') strat.good++
        else if (result.userRating === 'poor') strat.poor++
        else strat.notRated++

        if (result.success) strat.successRate++
        strat.avgImageCount += result.imageCount
      })
    })

    // Calculate percentages and averages
    Object.keys(analysis.strategies).forEach(key => {
      const strat = analysis.strategies[key]
      strat.successRate = (strat.successRate / strat.totalTests) * 100
      strat.avgImageCount = strat.avgImageCount / strat.totalTests
    })

    console.log('\n🔍 PATTERN ANALYSIS ACROSS ALL TESTS:')
    console.log(JSON.stringify(analysis, null, 2))

    // Find best strategies
    const ranked = Object.entries(analysis.strategies)
      .map(([name, data]) => ({
        name,
        score: (data.excellent * 3 + data.good * 1) / data.totalTests,
        ...data
      }))
      .sort((a, b) => b.score - a.score)

    console.log('\n🏆 TOP STRATEGIES (by rating score):')
    ranked.slice(0, 5).forEach((s, i) => {
      console.log(`${i + 1}. ${s.name}`)
      console.log(`   Score: ${s.score.toFixed(2)} | Success: ${s.successRate.toFixed(0)}% | Excellent: ${s.excellent} | Good: ${s.good} | Poor: ${s.poor}`)
    })

    setShowAnalysis(true)

    return { analysis, ranked }
  }

  // 10 Query Strategies - ITERATION 3 (Optimized based on Iteration 2 ratings)
  const strategies = [
    // TIER 1: EXCELLENT Strategies (50% excellent rating in Iteration 2)
    {
      name: '1. 🏆 Activity Name Only',
      buildQuery: (name: string) =>
        `${name}`
    },
    {
      name: '2. 🏆 Activity "in" City, Province',
      buildQuery: (name: string, loc: string) =>
        `${name} in ${loc}`
    },
    {
      name: '3. 🏆 Activity + City Only',
      buildQuery: (name: string, loc: string) => {
        const city = loc.split(',')[0]?.trim() || loc
        return `${name} ${city}`
      }
    },
    {
      name: '4. 🏆 Activity + City + Type',
      buildQuery: (name: string, loc: string, type: string) => {
        const city = loc.split(',')[0]?.trim() || loc
        return `${name} ${city} ${type}`
      }
    },
    {
      name: '5. 🏆 Activity + Full Location + Type',
      buildQuery: (name: string, loc: string, type: string) =>
        `${name} ${loc} ${type}`
    },

    // TIER 2: Optimizations & Variations
    {
      name: '6. Activity "near" City',
      buildQuery: (name: string, loc: string) => {
        const city = loc.split(',')[0]?.trim() || loc
        return `${name} near ${city}`
      }
    },
    {
      name: '7. Activity + Type Only',
      buildQuery: (name: string, _loc: string, type: string) =>
        `${name} ${type}`
    },
    {
      name: '8. Activity + Province',
      buildQuery: (name: string, loc: string) => {
        const province = loc.split(',')[1]?.trim() || loc
        return `${name} ${province}`
      }
    },
    {
      name: '9. Activity + Country (International)',
      buildQuery: (name: string, loc: string) => {
        // Extract last part (country) if comma-separated
        const parts = loc.split(',')
        const country = parts.length > 2 ? parts[parts.length - 1]?.trim() : loc
        return `${name} ${country}`
      }
    },
    {
      name: '10. Minimal: Activity + City Initial',
      buildQuery: (name: string, loc: string) => {
        const city = loc.split(',')[0]?.trim() || loc
        const cityInitial = city.split(' ')[0] // First word only
        return `${name} ${cityInitial}`
      }
    }
  ]

  const testAllStrategies = async () => {
    setLoading(true)
    setResults([])
    setSelectedStrategy(null)

    const testResults: TestResult[] = []

    for (let i = 0; i < strategies.length; i++) {
      const strategy = strategies[i]
      const query = strategy.buildQuery(activityName, location, activityType)

      console.log(`\n🧪 Testing Strategy ${i + 1}: ${strategy.name}`)
      console.log(`📝 Query: "${query}"`)

      try {
        const response = await fetch(
          `/api/images/search?query=${encodeURIComponent(query)}&limit=5&source=brave`
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        const images = data?.images || []

        testResults.push({
          strategy: strategy.name,
          query,
          images: images.slice(0, 5),
          success: images.length > 0,
          imageCount: images.length,
          userRating: null
        })

        console.log(`✅ Success: ${images.length} images found`)
        console.log(`📸 First image: ${images[0]?.title || 'N/A'}`)

      } catch (error) {
        console.error(`❌ Strategy ${i + 1} failed:`, error)
        testResults.push({
          strategy: strategy.name,
          query,
          images: [],
          success: false,
          imageCount: 0,
          userRating: null
        })
      }

      // Update UI after each strategy
      setResults([...testResults])

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    setLoading(false)
    console.log('\n🎯 All strategies tested!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-gray-900">
              🧪 Brave API Query Strategy Experiment
            </h1>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
              ITERATION 3 - OPTIMIZED
            </span>
          </div>
          <p className="text-gray-600 mb-2">
            <strong>Based on Iteration 2 ratings:</strong> 5 Excellent, 4 Good, 1 Poor. Testing optimized strategies with focus on simplicity and accuracy.
          </p>
          <div className="flex gap-2 text-sm flex-wrap">
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-semibold">🏆 = Excellent (50% in Iter 2)</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">New variations to test</span>
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded">❌ Removed: Generic queries (poor rating)</span>
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Parameters</h2>

          {/* Quick Test Case Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Select Test Case
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {testCases.map((testCase, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedTestCase(idx)
                    setActivityName(testCase.name)
                    setLocation(testCase.location)
                    setActivityType(testCase.type)
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedTestCase === idx
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {testCase.category}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity Name
              </label>
              <input
                type="text"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Kicking Horse Mountain Resort"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Golden, BC"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity Type
              </label>
              <input
                type="text"
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., ski resort"
              />
            </div>
          </div>

          <Button
            onClick={testAllStrategies}
            disabled={loading}
            className="w-full"
          >
            {loading ? '🧪 Testing Strategies...' : '🚀 Test All 10 Strategies'}
          </Button>
        </div>

        {/* Results Grid */}
        {results.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                📊 Results ({results.filter(r => r.success).length}/{results.length} successful)
              </h2>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Rated: {results.filter(r => r.userRating).length}/{results.length}
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
                  onClick={exportRatings}
                  disabled={results.filter(r => r.userRating).length === 0}
                  variant="outline"
                  size="sm"
                >
                  💾 Save Ratings
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition-all ${
                    selectedStrategy === idx
                      ? 'border-blue-500 ring-4 ring-blue-100'
                      : result.success
                      ? 'border-green-200 hover:border-green-400'
                      : 'border-red-200'
                  }`}
                  onClick={() => setSelectedStrategy(idx)}
                >
                  {/* Strategy Header */}
                  <div className={`p-4 ${
                    result.success ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {result.success ? '✅' : '❌'} {result.strategy}
                        </h3>
                        <p className="text-sm text-gray-600 font-mono bg-white px-3 py-1 rounded">
                          "{result.query}"
                        </p>
                      </div>

                      {/* Rating Buttons */}
                      {result.success && (
                        <div className="flex flex-col items-center gap-2">
                          <div className="text-xs text-gray-500 font-medium">Rate Accuracy:</div>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                rateStrategy(idx, result.userRating === 'excellent' ? null : 'excellent')
                              }}
                              className={`px-3 py-2 rounded-lg font-semibold transition-all ${
                                result.userRating === 'excellent'
                                  ? 'bg-green-500 text-white shadow-lg scale-110'
                                  : 'bg-white text-green-600 border-2 border-green-500 hover:bg-green-50'
                              }`}
                              title="Excellent - Perfect match"
                            >
                              ✓✓
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                rateStrategy(idx, result.userRating === 'good' ? null : 'good')
                              }}
                              className={`px-3 py-2 rounded-lg font-semibold transition-all ${
                                result.userRating === 'good'
                                  ? 'bg-yellow-500 text-white shadow-lg scale-110'
                                  : 'bg-white text-yellow-600 border-2 border-yellow-500 hover:bg-yellow-50'
                              }`}
                              title="Good - Mostly relevant"
                            >
                              ✓
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                rateStrategy(idx, result.userRating === 'poor' ? null : 'poor')
                              }}
                              className={`px-3 py-2 rounded-lg font-semibold transition-all ${
                                result.userRating === 'poor'
                                  ? 'bg-red-500 text-white shadow-lg scale-110'
                                  : 'bg-white text-red-600 border-2 border-red-500 hover:bg-red-50'
                              }`}
                              title="Poor - Not relevant"
                            >
                              ✗
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          result.success ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {result.imageCount}
                        </div>
                        <div className="text-xs text-gray-500">images</div>
                      </div>
                    </div>
                  </div>

                  {/* Images Row - Horizontal Scroll for Visual Comparison */}
                  {result.images.length > 0 && (
                    <div className="p-4 bg-gray-50">
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {result.images.map((img, imgIdx) => (
                          <div
                            key={imgIdx}
                            className="relative flex-shrink-0 w-48 h-48 rounded-lg overflow-hidden bg-gray-100 group border-2 border-gray-200 hover:border-blue-400 transition-all"
                          >
                            <Image
                              src={img.thumbnail || img.url}
                              alt={img.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="192px"
                            />
                            {/* Image number badge */}
                            <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs font-bold px-2 py-1 rounded">
                              #{imgIdx + 1}
                            </div>
                            {/* Title overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                              <p className="text-white text-xs font-medium line-clamp-2">
                                {img.title}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Scroll hint */}
                      {result.images.length > 3 && (
                        <p className="text-xs text-gray-400 text-center mt-2">
                          ← Scroll horizontally to see all {result.images.length} images →
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        {results.length === 0 && !loading && (
          <div className="bg-blue-50 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Ready to Test!
            </h3>
            <p className="text-gray-600 mb-4">
              Enter your test parameters above and click "Test All 10 Strategies" to begin the experiment.
            </p>
            <div className="text-left max-w-2xl mx-auto bg-white rounded-lg p-4 text-sm text-gray-600">
              <p className="font-semibold mb-2">📋 How it works:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Each strategy uses a different query pattern</li>
                <li>We fetch 5 images per strategy from Brave API</li>
                <li>Results show image count and thumbnails</li>
                <li>Click on a result to highlight it</li>
                <li>Review which strategy gives the most accurate images</li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Analysis Modal */}
      {showAnalysis && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                🔍 Pattern Analysis Across All Tests
              </h2>
              <button
                onClick={() => setShowAnalysis(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Total Tests</div>
                  <div className="text-3xl font-bold text-blue-600">{allTestResults.length}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Total Strategies</div>
                  <div className="text-3xl font-bold text-green-600">10</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Total Ratings</div>
                  <div className="text-3xl font-bold text-purple-600">
                    {allTestResults.reduce((sum, test) =>
                      sum + test.results.filter(r => r.userRating).length, 0
                    )}
                  </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">POI Types</div>
                  <div className="text-3xl font-bold text-orange-600">
                    {new Set(allTestResults.map(t => t.testCase)).size}
                  </div>
                </div>
              </div>

              {/* Test Cases List */}
              <div>
                <h3 className="text-lg font-semibold mb-3">📋 Test Cases</h3>
                <div className="space-y-2">
                  {allTestResults.map((test, i) => (
                    <div key={i} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="font-medium">{test.testCase}</span>
                        <span className="text-gray-600 ml-2">- {test.activityName}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(test.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strategy Rankings */}
              <div>
                <h3 className="text-lg font-semibold mb-3">🏆 Strategy Rankings</h3>
                <div className="space-y-3">
                  {(() => {
                    const analysis = {
                      strategies: {} as Record<string, {
                        totalTests: number
                        excellent: number
                        good: number
                        poor: number
                        notRated: number
                        successRate: number
                        avgImageCount: number
                      }>
                    }

                    allTestResults.forEach(test => {
                      test.results.forEach(result => {
                        if (!analysis.strategies[result.strategy]) {
                          analysis.strategies[result.strategy] = {
                            totalTests: 0,
                            excellent: 0,
                            good: 0,
                            poor: 0,
                            notRated: 0,
                            successRate: 0,
                            avgImageCount: 0
                          }
                        }

                        const strat = analysis.strategies[result.strategy]
                        strat.totalTests++

                        if (result.userRating === 'excellent') strat.excellent++
                        else if (result.userRating === 'good') strat.good++
                        else if (result.userRating === 'poor') strat.poor++
                        else strat.notRated++

                        if (result.success) strat.successRate++
                        strat.avgImageCount += result.imageCount
                      })
                    })

                    Object.keys(analysis.strategies).forEach(key => {
                      const strat = analysis.strategies[key]
                      strat.successRate = (strat.successRate / strat.totalTests) * 100
                      strat.avgImageCount = strat.avgImageCount / strat.totalTests
                    })

                    const ranked = Object.entries(analysis.strategies)
                      .map(([name, data]) => ({
                        name,
                        score: (data.excellent * 3 + data.good * 1) / data.totalTests,
                        ...data
                      }))
                      .sort((a, b) => b.score - a.score)

                    return ranked.map((strategy, i) => (
                      <div key={i} className="bg-white border border-gray-200 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-gray-400">#{i + 1}</span>
                            <span className="font-semibold">{strategy.name}</span>
                          </div>
                          <div className="text-2xl font-bold text-blue-600">
                            {strategy.score.toFixed(2)}
                          </div>
                        </div>

                        <div className="grid grid-cols-5 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600">Success Rate</div>
                            <div className="font-semibold">{strategy.successRate.toFixed(0)}%</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Excellent</div>
                            <div className="font-semibold text-green-600">{strategy.excellent}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Good</div>
                            <div className="font-semibold text-blue-600">{strategy.good}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Poor</div>
                            <div className="font-semibold text-red-600">{strategy.poor}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Avg Images</div>
                            <div className="font-semibold">{strategy.avgImageCount.toFixed(1)}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              </div>

              {/* Key Insights */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">💡 Key Insights</h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Check console for detailed JSON analysis</li>
                  <li>• Score = (Excellent × 3 + Good × 1) / Total Tests</li>
                  <li>• Higher score = better overall performance</li>
                  <li>• Success rate shows how often strategy returns images</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

