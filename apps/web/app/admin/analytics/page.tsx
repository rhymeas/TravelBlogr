'use client'

import { AdminBreadcrumb } from '@/components/admin/AdminNav'
import { BarChart3, TrendingUp, Users, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

export const dynamic = 'force-dynamic'

interface AnalyticsData {
  totalLimitHits: number
  uniqueUsers: number
  conversionRate: number
  topUsers: Array<{ userId: string; name: string; hits: number }>
  dailyTrend: Array<{ date: string; count: number }>
}

export default function AnalyticsAdminPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    fetchAnalytics()
  }, [days])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics/free-tier-limits?days=${days}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <AdminBreadcrumb currentPage="Analytics" />
        <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-2">
          Platform Analytics
        </h1>
        <p className="text-gray-600">
          Track free tier limits, user engagement, and conversion metrics
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6 flex gap-2">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              days === d
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Last {d} days
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin inline-block">
            <BarChart3 className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-600 mt-2">Loading analytics...</p>
        </div>
      ) : analytics ? (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Free Tier Limit Hits</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {analytics.totalLimitHits}
                    </p>
                  </div>
                  <Zap className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Unique Users</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {analytics.uniqueUsers}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Conversion Rate</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {analytics.conversionRate}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Users */}
          {analytics.topUsers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Users Hitting Free Tier Limits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topUsers.map((user, idx) => (
                    <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.userId}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{user.hits}</p>
                        <p className="text-xs text-gray-500">hits</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Daily Trend */}
          {analytics.dailyTrend.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Daily Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.dailyTrend.map((day) => (
                    <div key={day.date} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{day.date}</span>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 bg-blue-500 rounded"
                          style={{ width: `${Math.max(20, day.count * 5)}px` }}
                        />
                        <span className="text-sm font-medium text-gray-900 w-8 text-right">
                          {day.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Analytics Data
          </h3>
          <p className="text-gray-600">
            Analytics data will appear once users start hitting free tier limits
          </p>
        </div>
      )}
    </div>
  )
}

