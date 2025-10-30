import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'

export const dynamic = 'force-dynamic'

async function fetchAnalyticsSummary() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/analytics/summary`, {
      cache: 'no-store'
    })
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch analytics summary:', error)
    return null
  }
}

async function fetchCacheStats() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/analytics/cache-stats`, {
      cache: 'no-store'
    })
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch cache stats:', error)
    return null
  }
}

async function fetchSlowPages() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/analytics/slow-pages?limit=10`, {
      cache: 'no-store'
    })
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch slow pages:', error)
    return null
  }
}

async function fetchRecentErrors() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/analytics/errors?limit=10`, {
      cache: 'no-store'
    })
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch errors:', error)
    return null
  }
}

function OverviewTab({ data }: { data: any }) {
  if (!data?.success || !data?.data) {
    return (
      <div className="p-8 text-center text-gray-500">
        No analytics data available yet. Visit some location pages to generate metrics.
      </div>
    )
  }

  const stats = data.data

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Page Render</CardDescription>
            <CardTitle className="text-2xl">{stats.avg_duration_ms?.toFixed(0) || 0}ms</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>P95 Render Time</CardDescription>
            <CardTitle className="text-2xl">{stats.p95_duration_ms?.toFixed(0) || 0}ms</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>P99 Render Time</CardDescription>
            <CardTitle className="text-2xl">{stats.p99_duration_ms?.toFixed(0) || 0}ms</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Metrics</CardDescription>
            <CardTitle className="text-2xl">{stats.total_count || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Breakdown</CardTitle>
          <CardDescription>Last 24 hours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Average Duration</span>
              <span className="text-sm text-gray-600">{stats.avg_duration_ms?.toFixed(2) || 0}ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Median (P50)</span>
              <span className="text-sm text-gray-600">{stats.p50_duration_ms?.toFixed(2) || 0}ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">P95 Percentile</span>
              <span className="text-sm text-gray-600">{stats.p95_duration_ms?.toFixed(2) || 0}ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">P99 Percentile</span>
              <span className="text-sm text-gray-600">{stats.p99_duration_ms?.toFixed(2) || 0}ms</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CacheTab({ data }: { data: any }) {
  if (!data?.success || !data?.data || data.data.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No cache statistics available yet.
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cache Hit Rates</CardTitle>
        <CardDescription>Performance by cache key prefix</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.data.map((stat: any, index: number) => (
            <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
              <div className="flex-1">
                <div className="font-medium">{stat.cache_key_prefix || 'Unknown'}</div>
                <div className="text-sm text-gray-500">
                  {stat.total_requests || 0} requests
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600">
                    {stat.hit_rate?.toFixed(1) || 0}% hit rate
                  </div>
                  <div className="text-xs text-gray-500">
                    {stat.avg_duration_ms?.toFixed(0) || 0}ms avg
                  </div>
                </div>
                <Badge variant={stat.hit_rate > 70 ? 'default' : 'destructive'}>
                  {stat.hit_rate > 70 ? 'Good' : 'Poor'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function PagesTab({ data }: { data: any }) {
  if (!data?.success || !data?.data || data.data.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No page performance data available yet.
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Slowest Pages</CardTitle>
        <CardDescription>Pages with highest render times</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.data.map((page: any, index: number) => (
            <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
              <div className="flex-1">
                <div className="font-medium font-mono text-sm">{page.path || 'Unknown'}</div>
                <div className="text-sm text-gray-500">
                  {page.request_count || 0} requests
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {page.avg_duration_ms?.toFixed(0) || 0}ms avg
                  </div>
                  <div className="text-xs text-gray-500">
                    P95: {page.p95_duration_ms?.toFixed(0) || 0}ms
                  </div>
                </div>
                <Badge variant={page.avg_duration_ms < 500 ? 'default' : 'destructive'}>
                  {page.avg_duration_ms < 500 ? 'Fast' : 'Slow'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ErrorsTab({ data }: { data: any }) {
  if (!data?.success || !data?.data || data.data.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No errors recorded. Great job! 🎉
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Errors</CardTitle>
        <CardDescription>Last 10 errors with stack traces</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.data.map((error: any, index: number) => (
            <div key={index} className="border-b pb-4 last:border-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-medium text-red-600">{error.error_message || 'Unknown error'}</div>
                  <div className="text-sm text-gray-500 font-mono">{error.path || 'Unknown path'}</div>
                </div>
                <Badge variant="destructive">Error</Badge>
              </div>
              {error.stack_trace && (
                <details className="mt-2">
                  <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                    View stack trace
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                    {error.stack_trace}
                  </pre>
                </details>
              )}
              <div className="text-xs text-gray-400 mt-2">
                {new Date(error.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default async function AnalyticsTestPage() {
  const [summary, cacheStats, slowPages, errors] = await Promise.all([
    fetchAnalyticsSummary(),
    fetchCacheStats(),
    fetchSlowPages(),
    fetchRecentErrors()
  ])

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analytics Test Page</h1>
        <p className="text-gray-600">
          Testing the performance analytics system. Visit some location pages to generate metrics.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Suspense fallback={<div className="p-8 text-center">Loading overview...</div>}>
            <OverviewTab data={summary} />
          </Suspense>
        </TabsContent>

        <TabsContent value="cache">
          <Suspense fallback={<div className="p-8 text-center">Loading cache stats...</div>}>
            <CacheTab data={cacheStats} />
          </Suspense>
        </TabsContent>

        <TabsContent value="pages">
          <Suspense fallback={<div className="p-8 text-center">Loading page stats...</div>}>
            <PagesTab data={slowPages} />
          </Suspense>
        </TabsContent>

        <TabsContent value="errors">
          <Suspense fallback={<div className="p-8 text-center">Loading errors...</div>}>
            <ErrorsTab data={errors} />
          </Suspense>
        </TabsContent>
      </Tabs>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm font-mono">
            <div><strong>Summary API:</strong> {summary ? '✅ Connected' : '❌ Failed'}</div>
            <div><strong>Cache Stats API:</strong> {cacheStats ? '✅ Connected' : '❌ Failed'}</div>
            <div><strong>Slow Pages API:</strong> {slowPages ? '✅ Connected' : '❌ Failed'}</div>
            <div><strong>Errors API:</strong> {errors ? '✅ Connected' : '❌ Failed'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

