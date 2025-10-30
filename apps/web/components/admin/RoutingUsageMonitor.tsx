'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { Badge } from '@/components/ui/Badge'
import { AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react'

interface RoutingUsageStats {
  month: string
  total_requests: number
  valhalla_requests: number
  stadia_requests: number
  osrm_requests: number
  last_updated: string
}

const STADIA_FREE_TIER_LIMIT = 10000

export function RoutingUsageMonitor() {
  const [usage, setUsage] = useState<RoutingUsageStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsage()
    // Refresh every 30 seconds
    const interval = setInterval(fetchUsage, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchUsage() {
    try {
      const response = await fetch('/api/admin/routing-usage')
      if (response.ok) {
        const data = await response.json()
        setUsage(data)
      }
    } catch (error) {
      console.error('Failed to fetch routing usage:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Routing API Usage</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!usage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Routing API Usage</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const stadiaPercentage = (usage.stadia_requests / STADIA_FREE_TIER_LIMIT) * 100
  const stadiaRemaining = Math.max(0, STADIA_FREE_TIER_LIMIT - usage.stadia_requests)
  const isNearLimit = stadiaPercentage >= 80
  const isOverLimit = stadiaPercentage >= 100

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Routing API Usage</CardTitle>
              <CardDescription>
                Current month: {usage.month}
              </CardDescription>
            </div>
            <Badge variant={isOverLimit ? 'destructive' : isNearLimit ? 'secondary' : 'default'}>
              {isOverLimit ? 'Over Limit' : isNearLimit ? 'Near Limit' : 'Within Limit'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stadia Maps Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Stadia Maps (FREE Tier)</span>
              <span className="text-muted-foreground">
                {usage.stadia_requests.toLocaleString()} / {STADIA_FREE_TIER_LIMIT.toLocaleString()}
              </span>
            </div>
            <Progress value={Math.min(100, stadiaPercentage)} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{stadiaPercentage.toFixed(1)}% used</span>
              <span>{stadiaRemaining.toLocaleString()} remaining</span>
            </div>
          </div>

          {/* Alert if near or over limit */}
          {isNearLimit && (
            <div className={`p-4 rounded-lg border ${isOverLimit ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 mt-0.5 text-yellow-600" />
                <div className="flex-1">
                  {isOverLimit ? (
                    <>
                      <strong className="text-red-900">Stadia Maps limit exceeded!</strong>
                      <p className="text-sm text-red-700 mt-1">
                        Falling back to local Valhalla (Canada only). Consider upgrading to Starter plan ($20/month for 50,000 routes).
                      </p>
                    </>
                  ) : (
                    <>
                      <strong className="text-yellow-900">Approaching Stadia Maps limit.</strong>
                      <p className="text-sm text-yellow-700 mt-1">
                        You've used {stadiaPercentage.toFixed(0)}% of your free tier.
                        {stadiaRemaining < 1000 && ' Consider upgrading soon.'}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Success message if well within limit */}
          {!isNearLimit && usage.stadia_requests > 0 && (
            <div className="p-4 rounded-lg border bg-green-50 border-green-200">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 mt-0.5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm text-green-700">
                    You're well within the free tier limit. {stadiaRemaining.toLocaleString()} routes remaining this month.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Provider Breakdown */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Provider Breakdown
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Stadia Maps (Global)</div>
                <div className="text-2xl font-bold">{usage.stadia_requests.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Local Valhalla (Canada)</div>
                <div className="text-2xl font-bold">{usage.valhalla_requests.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-muted-foreground">OSRM (Fallback)</div>
                <div className="text-2xl font-bold">{usage.osrm_requests.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Total Requests</div>
                <div className="text-2xl font-bold">{usage.total_requests.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Last updated: {new Date(usage.last_updated).toLocaleString()}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Info */}
      {stadiaPercentage >= 70 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upgrade Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Starter Plan</div>
                <div className="text-sm text-muted-foreground">50,000 routes/month</div>
              </div>
              <div className="text-right">
                <div className="font-bold">$20/month</div>
                <div className="text-xs text-muted-foreground">Global coverage</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Standard Plan</div>
                <div className="text-sm text-muted-foreground">375,000 routes/month</div>
              </div>
              <div className="text-right">
                <div className="font-bold">$80/month</div>
                <div className="text-xs text-muted-foreground">Global coverage</div>
              </div>
            </div>
            <a
              href="https://stadiamaps.com/pricing/"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-sm text-primary hover:underline"
            >
              View all plans →
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

