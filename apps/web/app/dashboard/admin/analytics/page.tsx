'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  Activity, 
  Database, 
  Zap, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react'

interface PerformanceSummary {
  metric_type: string
  total_count: number
  avg_duration_ms: number
  p50_duration_ms: number
  p95_duration_ms: number
  p99_duration_ms: number
  error_count: number
}

interface CacheStat {
  cache_key_prefix: string
  total_requests: number
  cache_hits: number
  cache_misses: number
  hit_rate_percent: number
}

interface SlowPage {
  page_path: string
  request_count: number
  avg_duration_ms: number
  p95_duration_ms: number
  error_count: number
}

interface ErrorGroup {
  message: string
  count: number
  firstSeen: string
  lastSeen: string
  examples: any[]
}

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState(24) // hours
  const [summary, setSummary] = useState<PerformanceSummary[]>([])
  const [cacheStats, setCacheStats] = useState<{
    overallHitRate: number
    totalRequests: number
    totalHits: number
    cacheStats: CacheStat[]
  } | null>(null)
  const [slowPages, setSlowPages] = useState<SlowPage[]>([])
  const [errors, setErrors] = useState<{
    totalErrors: number
    uniqueErrors: number
    groupedErrors: ErrorGroup[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // Fetch all analytics data in parallel
      const [summaryRes, cacheRes, slowPagesRes, errorsRes] = await Promise.all([
        fetch(`/api/admin/analytics/summary?hours=${timeRange}`),
        fetch(`/api/admin/analytics/cache-stats?hours=${timeRange}`),
        fetch(`/api/admin/analytics/slow-pages?hours=${timeRange}&limit=20`),
        fetch(`/api/admin/analytics/errors?hours=${timeRange}&limit=50`)
      ])

      const [summaryData, cacheData, slowPagesData, errorsData] = await Promise.all([
        summaryRes.json(),
        cacheRes.json(),
        slowPagesRes.json(),
        errorsRes.json()
      ])

      setSummary(summaryData.summary || [])
      setCacheStats(cacheData)
      setSlowPages(slowPagesData.slowPages || [])
      setErrors(errorsData)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const getPerformanceColor = (ms: number) => {
    if (ms < 100) return 'text-green-600'
    if (ms < 500) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getCacheHitRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600'
    if (rate >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Analytics</h1>
          <p className="text-muted-foreground">Monitor system performance and errors</p>
        </div>
        
        <div className="flex gap-2">
          {[1, 6, 24, 168].map((hours) => (
            <Button
              key={hours}
              variant={timeRange === hours ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(hours)}
            >
              {hours === 1 ? '1h' : hours === 6 ? '6h' : hours === 24 ? '24h' : '7d'}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cache">Cache Performance</TabsTrigger>
            <TabsTrigger value="pages">Slow Pages</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {summary.map((metric) => (
                <Card key={metric.metric_type}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      {metric.metric_type === 'page_render' && <Activity className="h-4 w-4" />}
                      {metric.metric_type === 'cache_hit' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      {metric.metric_type === 'cache_miss' && <XCircle className="h-4 w-4 text-red-600" />}
                      {metric.metric_type === 'db_query' && <Database className="h-4 w-4" />}
                      {metric.metric_type.replace('_', ' ').toUpperCase()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metric.total_count.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Avg: <span className={getPerformanceColor(metric.avg_duration_ms)}>
                        {formatDuration(metric.avg_duration_ms)}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      P95: <span className={getPerformanceColor(metric.p95_duration_ms)}>
                        {formatDuration(metric.p95_duration_ms)}
                      </span>
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Cache Hit Rate */}
            {cacheStats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Cache Performance
                  </CardTitle>
                  <CardDescription>
                    Overall cache hit rate: {' '}
                    <span className={`font-bold ${getCacheHitRateColor(cacheStats.overallHitRate)}`}>
                      {cacheStats.overallHitRate.toFixed(2)}%
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {cacheStats.totalHits.toLocaleString()} hits / {cacheStats.totalRequests.toLocaleString()} requests
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="cache" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cache Hit Rates by Type</CardTitle>
                <CardDescription>Performance breakdown by cache key prefix</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cacheStats?.cacheStats.map((stat) => (
                    <div key={stat.cache_key_prefix} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{stat.cache_key_prefix}</div>
                        <div className="text-sm text-muted-foreground">
                          {stat.cache_hits.toLocaleString()} hits / {stat.total_requests.toLocaleString()} requests
                        </div>
                      </div>
                      <Badge className={getCacheHitRateColor(stat.hit_rate_percent)}>
                        {stat.hit_rate_percent.toFixed(2)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Slowest Pages
                </CardTitle>
                <CardDescription>Pages with highest average render time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {slowPages.map((page, index) => (
                    <div key={page.page_path} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          <span className="text-muted-foreground">#{index + 1}</span>
                          {page.page_path}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {page.request_count.toLocaleString()} requests
                          {page.error_count > 0 && (
                            <Badge variant="destructive" className="ml-2">
                              {page.error_count} errors
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${getPerformanceColor(page.avg_duration_ms)}`}>
                          {formatDuration(page.avg_duration_ms)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          P95: {formatDuration(page.p95_duration_ms)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Recent Errors
                </CardTitle>
                <CardDescription>
                  {errors?.totalErrors.toLocaleString()} total errors, {errors?.uniqueErrors} unique
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {errors?.groupedErrors.map((error, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-red-600">{error.message}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            First seen: {new Date(error.firstSeen).toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Last seen: {new Date(error.lastSeen).toLocaleString()}
                          </div>
                        </div>
                        <Badge variant="destructive">{error.count}x</Badge>
                      </div>
                      {error.examples.length > 0 && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            View examples ({error.examples.length})
                          </summary>
                          <div className="mt-2 space-y-2">
                            {error.examples.map((example: any) => (
                              <div key={example.id} className="p-2 bg-muted rounded">
                                <div className="font-mono text-xs">{example.page_path}</div>
                                {example.error_stack && (
                                  <pre className="mt-1 text-xs overflow-x-auto">
                                    {example.error_stack.split('\n').slice(0, 5).join('\n')}
                                  </pre>
                                )}
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

