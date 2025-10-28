'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ExternalLink, Clock, DollarSign, Users } from 'lucide-react'

interface Activity {
  id: string
  name: string
  description?: string
  category?: 'cultural' | 'outdoor' | 'food' | 'adventure' | 'relaxation'
  difficulty?: 'easy' | 'moderate' | 'hard'
  duration?: string
  cost?: 'free' | 'low' | 'medium' | 'high'
  image_url?: string
  link_url?: string
  link_source?: 'brave' | 'groq' | 'manual'
}

interface EnrichmentResult {
  image?: string
  link?: string
  description?: string
  source?: string
}

export default function ActivitiesTestPage() {
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: 'test-1',
      name: 'Lake Louise Gondola',
      description: 'Scenic gondola ride with mountain views',
      category: 'outdoor',
      difficulty: 'easy',
      duration: '2-3 hours',
      cost: 'medium',
      image_url: '',
      link_url: '',
    },
    {
      id: 'test-2',
      name: 'Banff Gondola',
      description: 'Ride to the summit of Sulphur Mountain',
      category: 'outdoor',
      difficulty: 'easy',
      duration: '2-3 hours',
      cost: 'medium',
      image_url: '',
      link_url: '',
    }
  ])

  const [locationName, setLocationName] = useState('Banff, Canada')
  const [loading, setLoading] = useState(false)
  const [enrichmentLogs, setEnrichmentLogs] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const addLog = (message: string) => {
    setEnrichmentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
    console.log(message)
  }

  const enrichAllActivities = async () => {
    setLoading(true)
    setError(null)
    setEnrichmentLogs([])

    try {
      addLog('🚀 Starting Brave enrichment for all activities...')

      for (const activity of activities) {
        addLog(`\n📍 Enriching: ${activity.name}`)

        // Step 0: Clear cache first to force fresh API calls
        addLog(`  🗑️ Clearing cache for: ${activity.name}`)
        try {
          const clearResponse = await fetch('/api/cache/clear-activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              activityName: activity.name,
              locationName: locationName
            })
          })
          if (clearResponse.ok) {
            addLog(`  ✅ Cache cleared`)
          } else {
            addLog(`  ⚠️ Cache clear failed (continuing anyway)`)
          }
        } catch (err) {
          addLog(`  ⚠️ Cache clear error (continuing anyway)`)
        }

        // Step 1: Try Brave API (images + links in parallel)
        const braveUrl = `/api/brave/activity-image?name=${encodeURIComponent(activity.name)}&location=${encodeURIComponent(locationName)}&type=activity&count=3`
        addLog(`  🔍 Calling Brave API: ${braveUrl}`)

        const braveResponse = await fetch(braveUrl)

        if (!braveResponse.ok) {
          addLog(`  ❌ Brave API failed: ${braveResponse.status} ${braveResponse.statusText}`)
          const errorText = await braveResponse.text()
          addLog(`  Error details: ${errorText}`)
          continue
        }

        const braveData = await braveResponse.json()
        addLog(`  ✅ Brave API response: ${JSON.stringify(braveData, null, 2)}`)

        if (braveData.success) {
          const images = braveData.data?.images || []
          const links = braveData.data?.links || []

          addLog(`  📊 Found ${images.length} images, ${links.length} links`)

          // Update activity with enriched data
          setActivities(prev => prev.map(a => {
            if (a.id === activity.id) {
              const updated = {
                ...a,
                // CRITICAL: Use thumbnail (Brave CDN URL) first, NOT url (source page URL)
                // See docs/MILESTONES.md - Milestone 1 (2025-01-27)
                image_url: images[0]?.thumbnail || images[0]?.url || a.image_url,
                link_url: links[0]?.url || links[0]?.website || a.link_url,
                link_source: 'brave' as const,
                // Extend description with link title if available
                description: links[0]?.description
                  ? `${a.description} - ${links[0].description.substring(0, 100)}...`
                  : a.description
              }

              if (updated.image_url) addLog(`  ✅ Image: ${updated.image_url.substring(0, 60)}...`)
              if (updated.link_url) addLog(`  ✅ Link: ${updated.link_url}`)

              return updated
            }
            return a
          }))
        } else {
          addLog(`  ⚠️ Brave API returned no results`)
        }

        // Rate limiting: 200ms delay
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      addLog('\n✅ Enrichment complete!')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      addLog(`❌ Fatal error: ${errorMsg}`)
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const resetActivities = () => {
    setActivities([
      {
        id: 'test-1',
        name: 'Lake Louise Gondola',
        description: 'Scenic gondola ride with mountain views',
        category: 'outdoor',
        difficulty: 'easy',
        duration: '2-3 hours',
        cost: 'medium'
      },
      {
        id: 'test-2',
        name: 'Banff Gondola',
        description: 'Ride to the summit of Sulphur Mountain',
        category: 'outdoor',
        difficulty: 'easy',
        duration: '2-3 hours',
        cost: 'medium'
      }
    ])
    setEnrichmentLogs([])
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 py-6 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Compact Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Things to Do in {locationName}</h1>
          <p className="text-sm text-gray-600">
            Testing Brave enrichment • {activities.length} activities
          </p>
        </div>

        {/* Compact Test Controls */}
        <div className="mb-4 flex gap-2">
          <Button
            onClick={enrichAllActivities}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-sm hover:shadow-md transition-all"
            size="sm"
          >
            {loading ? '⏳ Enriching...' : '🔍 Test Brave Enrichment'}
          </Button>
          <Button
            onClick={resetActivities}
            variant="outline"
            size="sm"
            className="border-gray-300"
          >
            Reset
          </Button>
        </div>

        <div className="space-y-3">
        {/* Activity Cards - Modern Bubbly Design */}
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="group relative bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden"
          >
            <div className="flex items-center gap-3 p-3">
              {/* Checkbox */}
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
              />

              {/* Image Thumbnail */}
              {activity.image_url ? (
                <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50">
                  <img
                    src={activity.image_url}
                    alt={activity.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.parentElement!.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      `
                    }}
                  />
                </div>
              ) : (
                <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <Users className="w-7 h-7 text-gray-500" />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-gray-900 mb-0.5 truncate">
                  {activity.name}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-1.5">
                  {activity.description}
                </p>

                {/* Compact Badges */}
                <div className="flex flex-wrap gap-1.5">
                  {activity.category && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {activity.category}
                    </span>
                  )}
                  {activity.difficulty && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                      {activity.difficulty}
                    </span>
                  )}
                  {activity.duration && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                      <Clock className="w-3 h-3" />
                      {activity.duration}
                    </span>
                  )}
                  {activity.cost && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                      <DollarSign className="w-3 h-3" />
                      {activity.cost === 'free' ? 'Free' : activity.cost}
                    </span>
                  )}
                </div>
              </div>

              {/* Link Button */}
              {activity.link_url && (
                <a
                  href={activity.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-xs font-medium whitespace-nowrap"
                >
                  Learn more
                </a>
              )}
            </div>

            {/* Source Badge (if enriched) */}
            {activity.link_source && (
              <div className="absolute top-2 right-2">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-gray-900/80 text-white backdrop-blur-sm">
                  {activity.link_source}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Compact Debug Logs */}
      {enrichmentLogs.length > 0 && (
        <div className="mt-4 bg-gray-900 rounded-xl p-3 shadow-lg">
          <h3 className="text-xs font-semibold text-gray-400 mb-2">Enrichment Logs</h3>
          <div className="text-green-400 font-mono text-xs max-h-64 overflow-y-auto space-y-0.5">
            {enrichmentLogs.map((log, i) => (
              <div key={i} className="leading-tight">{log}</div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
          <h3 className="text-xs font-semibold text-red-600 mb-1">Error</h3>
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}
      </div>
    </div>
  )
}

