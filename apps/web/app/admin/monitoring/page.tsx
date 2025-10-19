'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface StorageStats {
  storage: {
    totalSize: number
    itemCount: number
    oldestEntry: string
    newestEntry: string
    totalSizeBytes: number
    totalSizeMB: string
    breakdown: Record<string, { count: number; size: number }>
  }
  groq: {
    calls: number
    estimatedCost: number
  }
  rateLimits: Record<string, number>
  timestamp: string
}

export default function MonitoringPage() {
  const [stats, setStats] = useState<StorageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [cleanupLoading, setCleanupLoading] = useState(false)
  const [lastCleanup, setLastCleanup] = useState<{ deletedCount: number; timestamp: string } | null>(null)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/storage-stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const runCleanup = async () => {
    setCleanupLoading(true)
    try {
      const response = await fetch('/api/cron/cleanup-cache', { method: 'POST' })
      const data = await response.json()
      setLastCleanup(data)
      // Refresh stats after cleanup
      await fetchStats()
    } catch (error) {
      console.error('Error running cleanup:', error)
    } finally {
      setCleanupLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !stats) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading monitoring data...</div>
        </div>
      </div>
    )
  }

  const getRateLimitStatus = (apiName: string, current: number, limit: number) => {
    const percentage = (current / limit) * 100
    if (percentage >= 90) return 'destructive'
    if (percentage >= 70) return 'warning'
    return 'success'
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-gray-500 mt-1">
            Real-time monitoring of storage, API usage, and costs
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchStats} disabled={loading} variant="outline">
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button onClick={runCleanup} disabled={cleanupLoading}>
            {cleanupLoading ? 'Cleaning...' : 'Run Cleanup'}
          </Button>
        </div>
      </div>

      {lastCleanup && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <span className="text-green-600 font-medium">✓ Cleanup Complete:</span>
              <span>Deleted {lastCleanup.deletedCount} expired entries</span>
              <span className="text-gray-500 text-sm">
                ({new Date(lastCleanup.timestamp).toLocaleString()})
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Total Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.storage.totalSizeMB} MB</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.storage.totalSizeBytes.toLocaleString()} bytes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Cache Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.storage.itemCount}</div>
            <p className="text-xs text-gray-500 mt-1">Total cached items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">GROQ Calls (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.groq.calls}</div>
            <p className="text-xs text-gray-500 mt-1">
              ~${stats?.groq.estimatedCost.toFixed(4)} estimated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Cache Age</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {stats?.storage.oldestEntry
                ? new Date(stats.storage.oldestEntry).toLocaleDateString()
                : 'N/A'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Oldest entry</p>
          </CardContent>
        </Card>
      </div>

      {/* Cache Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Breakdown by Type</CardTitle>
          <CardDescription>Storage usage by cache type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.storage.breakdown &&
              Object.entries(stats.storage.breakdown).map(([type, data]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{type}</Badge>
                    <span className="text-sm text-gray-600">{data.count} items</span>
                  </div>
                  <div className="text-sm font-medium">
                    {(data.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Rate Limits */}
      <Card>
        <CardHeader>
          <CardTitle>API Rate Limits (Last Hour)</CardTitle>
          <CardDescription>Current usage vs. limits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* OpenTripMap */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">OpenTripMap</span>
                <span className="text-sm text-gray-600">
                  {stats?.rateLimits.opentripmap || 0} / 1000
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(((stats?.rateLimits.opentripmap || 0) / 1000) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* GROQ */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">GROQ</span>
                <span className="text-sm text-gray-600">
                  {stats?.rateLimits.groq || 0} / 6000
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(((stats?.rateLimits.groq || 0) / 6000) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Overpass */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overpass API</span>
                <span className="text-sm text-gray-600">
                  {stats?.rateLimits.overpass || 0} / 10000
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(((stats?.rateLimits.overpass || 0) / 10000) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {stats?.timestamp ? new Date(stats.timestamp).toLocaleString() : 'N/A'}
      </div>
    </div>
  )
}

