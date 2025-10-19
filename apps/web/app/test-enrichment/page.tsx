'use client'

/**
 * Test Enrichment Page
 * 
 * Simple page to test blog post enrichment in the browser.
 * Navigate to /test-enrichment to see the results.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Loader2, CheckCircle, XCircle, MapPin, Image as ImageIcon, Bus } from 'lucide-react'

const sampleDays = [
  {
    day_number: 1,
    title: "Arrival in Rome",
    description: "Arrive in Rome and explore the historic city center.",
    activities: ["Visit the Colosseum", "Explore the Roman Forum"],
    location: { name: "Rome" }
  },
  {
    day_number: 2,
    title: "Vatican City",
    description: "Spend the day exploring Vatican City.",
    activities: ["Visit St. Peter's Basilica", "Tour the Vatican Museums"],
    location: { name: "Vatican City" }
  },
  {
    day_number: 3,
    title: "Trastevere",
    description: "Explore the charming Trastevere neighborhood.",
    activities: ["Walk through Trastevere", "Try local trattorias"],
    location: { name: "Trastevere, Rome" }
  }
]

export default function TestEnrichmentPage() {
  const [enrichedDays, setEnrichedDays] = useState<any[]>([])
  const [isEnriching, setIsEnriching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runTest = async () => {
    setIsEnriching(true)
    setError(null)
    
    try {
      const response = await fetch('/api/blog/enrich-days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: sampleDays })
      })

      if (!response.ok) {
        throw new Error('Failed to enrich days')
      }

      const data = await response.json()
      setEnrichedDays(data.days)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsEnriching(false)
    }
  }

  const stats = enrichedDays.length > 0 ? {
    total: enrichedDays.length,
    withCoordinates: enrichedDays.filter(d => d.location?.coordinates).length,
    withImages: enrichedDays.filter(d => d.location?.image).length,
    withPOIs: enrichedDays.filter(d => d.location?.pois?.length > 0).length,
    withTransportation: enrichedDays.filter(d => d.location?.transportation?.providers?.length > 0).length,
    totalPOIs: enrichedDays.reduce((sum, d) => sum + (d.location?.pois?.length || 0), 0)
  } : null

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Blog Post Enrichment Test
          </h1>
          <p className="text-gray-600">
            Test the enrichment service with sample blog post days
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Sample Days:</p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {sampleDays.map(day => (
                    <li key={day.day_number}>
                      Day {day.day_number}: {day.title} ({day.location.name})
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                onClick={runTest}
                disabled={isEnriching}
                className="w-full"
              >
                {isEnriching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enriching...
                  </>
                ) : (
                  'Run Enrichment Test'
                )}
              </Button>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900">Error</p>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {stats && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Results Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-sm text-gray-600">Total Days</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{stats.withImages}/{stats.total}</div>
                  <div className="text-sm text-gray-600">With Images</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{stats.withCoordinates}/{stats.total}</div>
                  <div className="text-sm text-gray-600">With Coordinates</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{stats.withPOIs}/{stats.total}</div>
                  <div className="text-sm text-gray-600">With POIs</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">{stats.withTransportation}/{stats.total}</div>
                  <div className="text-sm text-gray-600">With Transport</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600">{stats.totalPOIs}</div>
                  <div className="text-sm text-gray-600">Total POIs</div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <div className="text-5xl font-bold text-green-600">
                  {Math.round((stats.withImages / stats.total) * 100)}%
                </div>
                <div className="text-sm text-gray-600 mt-1">Success Rate</div>
              </div>
            </CardContent>
          </Card>
        )}

        {enrichedDays.length > 0 && (
          <div className="space-y-6">
            {enrichedDays.map((day, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>Day {day.day_number}: {day.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Location:</p>
                    <p className="text-gray-900">{day.location?.name || 'Unknown'}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Coordinates */}
                    <div className="flex items-start gap-3">
                      {day.location?.coordinates ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Coordinates</p>
                            <p className="text-sm text-gray-600">
                              {day.location.coordinates.lat.toFixed(4)}, {day.location.coordinates.lng.toFixed(4)}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">No Coordinates</p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Image */}
                    <div className="flex items-start gap-3">
                      {day.location?.image ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">Image</p>
                            <img 
                              src={day.location.image} 
                              alt={day.location.name}
                              className="mt-2 w-full h-32 object-cover rounded-lg"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">No Image</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* POIs */}
                  {day.location?.pois && day.location.pois.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        POIs ({day.location.pois.length})
                      </p>
                      <div className="space-y-2">
                        {day.location.pois.slice(0, 3).map((poi: any, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                              <span className="font-medium">{poi.name}</span>
                              <span className="text-gray-500"> - {poi.category}</span>
                            </div>
                          </div>
                        ))}
                        {day.location.pois.length > 3 && (
                          <p className="text-sm text-gray-500">
                            ... and {day.location.pois.length - 3} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Transportation */}
                  {day.location?.transportation?.providers && day.location.transportation.providers.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Transportation ({day.location.transportation.providers.length} providers)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {day.location.transportation.providers.map((provider: string, i: number) => (
                          <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                            <Bus className="h-3 w-3" />
                            {provider}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

