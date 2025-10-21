'use client'

/**
 * Admin Feature Flags Dashboard
 * 
 * Centralized control panel for toggling feature flags.
 * Updates environment variables dynamically (requires server restart for NEXT_PUBLIC_* vars).
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { AlertCircle, CheckCircle2, Info, RefreshCw } from 'lucide-react'
import { AdminBreadcrumb } from '@/components/admin/AdminNav'

interface FeatureFlag {
  key: string
  name: string
  description: string
  enabled: boolean
  requiresRestart: boolean
  category: 'performance' | 'features' | 'experimental'
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([
    {
      key: 'TRIP_PLANNER_V2',
      name: 'Trip Planner V2',
      description: 'New progressive multi-step trip planner with improved UX. Client-side only (no restart needed).',
      enabled: false,
      requiresRestart: false,
      category: 'experimental'
    },
    {
      key: 'NEXT_PUBLIC_ENABLE_SMART_POI',
      name: 'Smart POI System',
      description: 'Multi-layer caching for POIs with 7-day TTL. Reduces API calls by 50%.',
      enabled: false,
      requiresRestart: true,
      category: 'performance'
    },
    {
      key: 'NEXT_PUBLIC_ENABLE_GROQ_VALIDATION',
      name: 'GROQ POI Validation',
      description: 'AI-powered POI relevance validation. Cached for 3 days. ~$0.001/validation.',
      enabled: false,
      requiresRestart: true,
      category: 'features'
    },
    {
      key: 'NEXT_PUBLIC_ENABLE_PROGRESSIVE_LOADING',
      name: 'Progressive Loading',
      description: 'Show cached data immediately, enhance progressively. Better UX.',
      enabled: false,
      requiresRestart: true,
      category: 'features'
    },
    {
      key: 'NEXT_PUBLIC_ENABLE_EXTERNAL_APIS',
      name: 'External APIs',
      description: 'Enable Foursquare, Yelp, Wikidata, Nominatim for better POI coverage. Free tiers.',
      enabled: false,
      requiresRestart: true,
      category: 'features'
    },
    {
      key: 'NEXT_PUBLIC_ENABLE_BATCH_PROCESSING',
      name: 'Batch Blog Processing',
      description: 'Process blog generation in batches (10 trips at a time). Prevents overload.',
      enabled: false,
      requiresRestart: true,
      category: 'performance'
    }
  ])

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)

  // Load current flag states from environment
  useEffect(() => {
    loadFlagStates()
  }, [])

  const loadFlagStates = () => {
    setFlags(prev => prev.map(flag => {
      // Special handling for client-side flags
      if (flag.key === 'TRIP_PLANNER_V2') {
        const stored = localStorage.getItem('useTripPlannerV2')
        return { ...flag, enabled: stored === 'true' }
      }
      // Server-side flags from environment
      return {
        ...flag,
        enabled: process.env[flag.key] === 'true'
      }
    }))
  }

  const handleToggle = async (flagKey: string) => {
    const flag = flags.find(f => f.key === flagKey)
    if (!flag) return

    setLoading(true)
    setMessage(null)

    try {
      const newEnabled = !flag.enabled

      // Special handling for client-side flags
      if (flagKey === 'TRIP_PLANNER_V2') {
        // Update localStorage directly
        localStorage.setItem('useTripPlannerV2', String(newEnabled))
        window.dispatchEvent(new Event('tripPlannerVersionChanged'))

        // Update local state
        setFlags(prev => prev.map(f =>
          f.key === flagKey ? { ...f, enabled: newEnabled } : f
        ))

        setMessage({
          type: 'success',
          text: `${flag.name} ${newEnabled ? 'enabled' : 'disabled'} successfully! Changes apply immediately.`
        })

        setLoading(false)
        return
      }

      // Server-side flags - call API to update .env.local
      const response = await fetch('/api/admin/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: flagKey,
          value: newEnabled
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update feature flag')
      }

      // Update local state
      setFlags(prev => prev.map(f =>
        f.key === flagKey ? { ...f, enabled: newEnabled } : f
      ))

      setMessage({
        type: flag.requiresRestart ? 'info' : 'success',
        text: flag.requiresRestart
          ? `${flag.name} ${newEnabled ? 'enabled' : 'disabled'}. Restart server to apply changes.`
          : `${flag.name} ${newEnabled ? 'enabled' : 'disabled'} successfully!`
      })
    } catch (error) {
      console.error('Error toggling flag:', error)
      setMessage({
        type: 'error',
        text: 'Failed to update feature flag. Check console for details.'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRestartServer = () => {
    setMessage({
      type: 'info',
      text: 'To restart: Stop the dev server (Ctrl+C) and run "npm run dev" again.'
    })
  }

  const categoryColors = {
    performance: 'bg-blue-100 text-blue-800',
    features: 'bg-green-100 text-green-800',
    experimental: 'bg-yellow-100 text-yellow-800'
  }

  const enabledCount = flags.filter(f => f.enabled).length
  const totalCount = flags.length

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <AdminBreadcrumb currentPage="Feature Flags" />
        <h1 className="text-3xl font-bold mt-2 mb-2">Feature Flags</h1>
        <p className="text-gray-600">
          Control feature rollout and performance optimizations
        </p>
      </div>

      {/* Summary Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{enabledCount}/{totalCount}</p>
              <p className="text-sm text-gray-600">Features Enabled</p>
            </div>
            <Button
              onClick={handleRestartServer}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Restart Instructions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Message Alert */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' :
          message.type === 'error' ? 'bg-red-50 text-red-800' :
          'bg-blue-50 text-blue-800'
        }`}>
          {message.type === 'success' && <CheckCircle2 className="w-5 h-5 mt-0.5" />}
          {message.type === 'error' && <AlertCircle className="w-5 h-5 mt-0.5" />}
          {message.type === 'info' && <Info className="w-5 h-5 mt-0.5" />}
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* Feature Flags List */}
      <div className="space-y-4">
        {flags.map((flag) => (
          <Card key={flag.key}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{flag.name}</CardTitle>
                    <Badge className={categoryColors[flag.category]}>
                      {flag.category}
                    </Badge>
                    {flag.enabled && (
                      <Badge className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{flag.description}</CardDescription>
                  {flag.requiresRestart && (
                    <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Requires server restart to apply
                    </p>
                  )}
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={flag.enabled}
                    onChange={() => handleToggle(flag.key)}
                    disabled={loading}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      <Card className="mt-6 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="w-4 h-4" />
            Important Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>• Feature flags with <code className="bg-white px-1 rounded">NEXT_PUBLIC_*</code> prefix require server restart</p>
          <p>• Changes are saved to <code className="bg-white px-1 rounded">.env.local</code></p>
          <p>• Monitor performance metrics after enabling new features</p>
          <p>• Disable flags immediately if issues arise</p>
        </CardContent>
      </Card>
    </div>
  )
}

