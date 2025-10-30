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
    <div className="min-h-screen apple-bg-primary">
      <div className="max-w-[1400px] mx-auto px-8 py-10">
        <AdminBreadcrumb currentPage="Analytics" />
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold apple-text-primary tracking-tight mb-2">
            Platform Analytics
          </h1>
          <p className="text-lg apple-text-secondary font-medium">
            Track free tier limits, user engagement, and conversion metrics
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-8 flex gap-3">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-6 py-3 rounded-xl font-semibold apple-transition ${
                days === d
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'apple-card apple-text-secondary hover:apple-text-primary'
              }`}
            >
              Last {d} days
            </button>
          ))}
        </div>

        {loading ? (
          <div className="apple-card p-12 text-center">
            <div className="animate-spin inline-block">
              <BarChart3 className="h-12 w-12 text-blue-600" />
            </div>
            <p className="apple-text-secondary mt-4 font-medium">Loading analytics...</p>
          </div>
        ) : analytics ? (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="apple-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl shadow-sm">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm apple-text-secondary font-medium mb-1">Free Tier Limit Hits</p>
                  <p className="text-4xl font-bold apple-text-primary tracking-tight">
                    {analytics.totalLimitHits}
                  </p>
                </div>
              </div>

              <div className="apple-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-sm">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm apple-text-secondary font-medium mb-1">Unique Users</p>
                  <p className="text-4xl font-bold apple-text-primary tracking-tight">
                    {analytics.uniqueUsers}
                  </p>
                </div>
              </div>

              <div className="apple-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-sm">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm apple-text-secondary font-medium mb-1">Conversion Rate</p>
                  <p className="text-4xl font-bold apple-text-primary tracking-tight">
                    {analytics.conversionRate}%
                  </p>
                </div>
              </div>
            </div>

            {/* Top Users */}
            {analytics.topUsers.length > 0 && (
              <div className="apple-card p-8">
                <h2 className="text-2xl font-bold apple-text-primary mb-6">
                  Top Users Hitting Free Tier Limits
                </h2>
                <div className="space-y-3">
                  {analytics.topUsers.map((user, idx) => (
                    <div key={user.userId} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 apple-transition">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-sm">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-semibold apple-text-primary">{user.name}</p>
                          <p className="text-xs apple-text-tertiary">{user.userId}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold apple-text-primary">{user.hits}</p>
                        <p className="text-xs apple-text-tertiary">hits</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daily Trend */}
            {analytics.dailyTrend.length > 0 && (
              <div className="apple-card p-8">
                <h2 className="text-2xl font-bold apple-text-primary mb-6">Daily Trend</h2>
                <div className="space-y-3">
                  {analytics.dailyTrend.map((day) => (
                    <div key={day.date} className="flex items-center justify-between">
                      <span className="text-sm apple-text-secondary font-medium">{day.date}</span>
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full apple-transition"
                          style={{ width: `${Math.max(30, day.count * 5)}px` }}
                        />
                        <span className="text-sm font-bold apple-text-primary w-10 text-right">
                          {day.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="apple-card p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl w-fit mx-auto mb-6">
                <BarChart3 className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold apple-text-primary mb-3">
                No Analytics Data
              </h3>
              <p className="apple-text-secondary leading-relaxed">
                Analytics data will appear once users start hitting free tier limits
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

