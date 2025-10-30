'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ExternalLink, Clock, DollarSign, Users, X, Link as LinkIcon } from 'lucide-react'

interface Activity {
  id: string
  name: string
  description?: string
  category?: 'cultural' | 'outdoor' | 'food' | 'adventure' | 'relaxation' | 'attraction' | 'restaurant' | 'activity' | 'nature'
  difficulty?: 'easy' | 'moderate' | 'hard'
  duration?: string
  cost?: 'free' | 'low' | 'medium' | 'high'
  image_url?: string
  link_url?: string
  link_source?: 'brave' | 'groq' | 'manual'
  tags?: string[]
}

interface EnrichmentResult {
  image?: string
  link?: string
  description?: string
  source?: string
}

export default function ActivitiesTestPage() {
  const [activities, setActivities] = useState<Activity[]>([])

  const [locationName, setLocationName] = useState('')
  const [newActivityName, setNewActivityName] = useState('')
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

  const addActivity = () => {
    if (!newActivityName.trim()) return

    const newActivity: Activity = {
      id: `test-${Date.now()}`,
      name: newActivityName.trim(),
      description: '',
      category: 'outdoor',
      difficulty: 'easy',
      duration: '',
      cost: 'medium',
      image_url: '',
      link_url: ''
    }

    setActivities(prev => [...prev, newActivity])
    setNewActivityName('')
  }

  const fetchRandomPOIs = async () => {
    if (!locationName.trim()) {
      setError('Please enter a location first')
      return
    }

    setLoading(true)
    setError(null)
    setEnrichmentLogs([])

    try {
      addLog('🎲 Fetching 3 random POIs for: ' + locationName)

      // Step 1: Get POI suggestions from GROQ
      const response = await fetch(
        `/api/locations/random-pois?location=${encodeURIComponent(locationName)}&count=3`
      )

      if (!response.ok) {
        throw new Error(`API failed: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch POIs')
      }

      addLog(`✅ Received ${data.pois.length} POIs from GROQ`)

      // Step 2: Convert POIs to activities (without images/links yet)
      const newActivities: Activity[] = data.pois.map((poi: any, index: number) => ({
        id: `poi-${Date.now()}-${index}`,
        name: poi.title,
        description: poi.description,
        category: poi.category || 'outdoor',
        difficulty: 'easy',
        duration: '',
        cost: 'medium',
        image_url: '',
        link_url: '',
        tags: poi.tags || []
      }))

      setActivities(newActivities)

      // Step 3: Enrich each POI with images and links from Brave API
      addLog('\n🔍 Enriching POIs with Brave API (images + links)...')

      for (const activity of newActivities) {
        addLog(`\n📍 Enriching: ${activity.name}`)

        // Call existing Brave API that already works
        const braveUrl = `/api/brave/activity-image?name=${encodeURIComponent(activity.name)}&location=${encodeURIComponent(locationName)}&type=activity&count=3`
        addLog(`  🔍 Calling Brave API: ${braveUrl}`)

        const braveResponse = await fetch(braveUrl)

        if (!braveResponse.ok) {
          addLog(`  ❌ Brave API failed: ${braveResponse.status}`)
          continue
        }

        const braveData = await braveResponse.json()

        if (braveData.success) {
          const images = braveData.data?.images || []
          const links = braveData.data?.links || []

          addLog(`  📊 Found ${images.length} images, ${links.length} links`)

          // Update activity with enriched data
          setActivities(prev => prev.map(a => {
            if (a.id === activity.id) {
              const updated = {
                ...a,
                // CRITICAL: Use thumbnail (Brave CDN URL) first
                image_url: images[0]?.thumbnail || images[0]?.url || a.image_url,
                link_url: links[0]?.url || links[0]?.website || a.link_url,
                link_source: 'brave' as const
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

      addLog('\n✅ Random POIs loaded and enriched successfully!')

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      addLog(`❌ Error: ${errorMsg}`)
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const removeActivity = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id))
  }

  const resetActivities = () => {
    setActivities([])
    setLocationName('')
    setNewActivityName('')
    setEnrichmentLogs([])
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 py-6 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Compact Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Things to Do Test Page</h1>
          <p className="text-sm text-gray-600">
            Testing Brave enrichment with free-form entry • {activities.length} activities
          </p>
        </div>

        {/* Location Input */}
        <div className="mb-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location Name
          </label>
          <input
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="e.g., Banff, Canada or Tokyo, Japan"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        {/* Add Activity Form */}
        <div className="mb-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Activity
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newActivityName}
              onChange={(e) => setNewActivityName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addActivity()}
              placeholder="e.g., Tokyo Tower or Eiffel Tower"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <Button
              onClick={addActivity}
              disabled={!newActivityName.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              size="sm"
            >
              Add
            </Button>
          </div>
        </div>

        {/* Compact Test Controls */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            onClick={fetchRandomPOIs}
            disabled={loading || !locationName.trim()}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm hover:shadow-md transition-all"
            size="sm"
          >
            {loading ? '⏳ Loading...' : '🎲 Get 3 Random POIs'}
          </Button>
          <Button
            onClick={enrichAllActivities}
            disabled={loading || activities.length === 0}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-sm hover:shadow-md transition-all"
            size="sm"
          >
            {loading ? '⏳ Enriching...' : '🔍 Enrich Existing Activities'}
          </Button>
          <Button
            onClick={resetActivities}
            variant="outline"
            size="sm"
            className="border-gray-300"
          >
            Clear All
          </Button>
        </div>

        {/* Empty State */}
        {activities.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activities Yet</h3>
              <p className="text-sm text-gray-600 mb-6">
                Add a location and some activities to test Brave API enrichment with images and links.
              </p>
              <div className="space-y-3 text-left bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-700">Quick Start:</p>
                <ol className="text-xs text-gray-600 space-y-2 list-decimal list-inside">
                  <li>Enter a location (e.g., "Tokyo, Japan")</li>
                  <li>Add activities (e.g., "Tokyo Tower", "Senso-ji Temple")</li>
                  <li>Click "Test Brave Enrichment"</li>
                  <li>Check if images and links appear correctly</li>
                </ol>
              </div>
            </div>
          </div>
        ) : (
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

                {/* Tags (from random POIs) */}
                {activity.tags && activity.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {activity.tags.slice(0, 5).map((tag, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

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

              {/* Action Buttons */}
              <div className="flex-shrink-0 flex items-center gap-2">
                {/* Link Button */}
                {activity.link_url ? (
                  <a
                    href={activity.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-xs font-medium whitespace-nowrap"
                    title={activity.link_url}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Learn more
                  </a>
                ) : (
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-400 text-xs font-medium">
                    <LinkIcon className="w-3.5 h-3.5" />
                    No link
                  </div>
                )}

                {/* Remove Button */}
                <button
                  onClick={() => removeActivity(activity.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                  title="Remove activity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Link URL Display (if exists) */}
            {activity.link_url && (
              <div className="px-3 pb-3 pt-0">
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-2 py-1.5">
                  <LinkIcon className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate font-mono">{activity.link_url}</span>
                  {activity.link_source && (
                    <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-gray-900 text-white text-xs font-medium">
                      {activity.link_source}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        </div>
      )}

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

