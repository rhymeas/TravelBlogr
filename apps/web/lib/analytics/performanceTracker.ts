/**
 * Performance Analytics Tracker
 * 
 * Tracks:
 * - Page render times
 * - Cache hit/miss rates
 * - Database query performance
 * - API response times
 * - Error rates
 */

import { createServiceSupabase } from '@/lib/supabase-server'

export interface PerformanceMetric {
  metric_type: 'page_render' | 'cache_hit' | 'cache_miss' | 'db_query' | 'api_call' | 'error'
  page_path?: string
  duration_ms?: number
  cache_key?: string
  query_type?: string
  error_message?: string
  error_stack?: string
  user_agent?: string
  ip_address?: string
  metadata?: Record<string, any>
}

export class PerformanceTracker {
  private static instance: PerformanceTracker
  private metrics: PerformanceMetric[] = []
  private flushInterval: NodeJS.Timeout | null = null
  private readonly BATCH_SIZE = 50
  private readonly FLUSH_INTERVAL_MS = 10000 // 10 seconds

  private constructor() {
    // Start auto-flush
    this.startAutoFlush()
  }

  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker()
    }
    return PerformanceTracker.instance
  }

  /**
   * Track page render performance
   */
  trackPageRender(path: string, durationMs: number, metadata?: Record<string, any>) {
    this.addMetric({
      metric_type: 'page_render',
      page_path: path,
      duration_ms: durationMs,
      metadata
    })
  }

  /**
   * Track cache hit
   */
  trackCacheHit(cacheKey: string, durationMs: number) {
    this.addMetric({
      metric_type: 'cache_hit',
      cache_key: cacheKey,
      duration_ms: durationMs
    })
  }

  /**
   * Track cache miss
   */
  trackCacheMiss(cacheKey: string, durationMs: number) {
    this.addMetric({
      metric_type: 'cache_miss',
      cache_key: cacheKey,
      duration_ms: durationMs
    })
  }

  /**
   * Track database query
   */
  trackDbQuery(queryType: string, durationMs: number, metadata?: Record<string, any>) {
    this.addMetric({
      metric_type: 'db_query',
      query_type: queryType,
      duration_ms: durationMs,
      metadata
    })
  }

  /**
   * Track API call
   */
  trackApiCall(path: string, durationMs: number, metadata?: Record<string, any>) {
    this.addMetric({
      metric_type: 'api_call',
      page_path: path,
      duration_ms: durationMs,
      metadata
    })
  }

  /**
   * Track error
   */
  trackError(error: Error, path?: string, metadata?: Record<string, any>) {
    this.addMetric({
      metric_type: 'error',
      page_path: path,
      error_message: error.message,
      error_stack: error.stack,
      metadata
    })
  }

  /**
   * Add metric to batch
   */
  private addMetric(metric: PerformanceMetric) {
    this.metrics.push({
      ...metric,
      metadata: {
        ...metric.metadata,
        timestamp: new Date().toISOString()
      }
    })

    // Flush if batch is full
    if (this.metrics.length >= this.BATCH_SIZE) {
      this.flush()
    }
  }

  /**
   * Flush metrics to database
   */
  private async flush() {
    if (this.metrics.length === 0) return

    const metricsToFlush = [...this.metrics]
    this.metrics = []

    try {
      const supabase = createServiceSupabase()
      const { error } = await supabase
        .from('performance_metrics')
        .insert(metricsToFlush)

      if (error) {
        console.error('❌ Failed to flush performance metrics:', error)
        // Put metrics back if flush failed
        this.metrics.unshift(...metricsToFlush)
      } else {
        console.log(`✅ Flushed ${metricsToFlush.length} performance metrics`)
      }
    } catch (error) {
      console.error('❌ Error flushing metrics:', error)
      // Put metrics back if flush failed
      this.metrics.unshift(...metricsToFlush)
    }
  }

  /**
   * Start auto-flush interval
   */
  private startAutoFlush() {
    if (this.flushInterval) return

    this.flushInterval = setInterval(() => {
      this.flush()
    }, this.FLUSH_INTERVAL_MS)
  }

  /**
   * Stop auto-flush interval
   */
  stopAutoFlush() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
  }

  /**
   * Force flush all pending metrics
   */
  async forceFlush() {
    await this.flush()
  }
}

/**
 * Singleton instance
 */
export const performanceTracker = PerformanceTracker.getInstance()

/**
 * Helper function to measure async operations
 */
export async function measureAsync<T>(
  operation: () => Promise<T>,
  onComplete: (durationMs: number, result: T) => void
): Promise<T> {
  const startTime = Date.now()
  try {
    const result = await operation()
    const durationMs = Date.now() - startTime
    onComplete(durationMs, result)
    return result
  } catch (error) {
    const durationMs = Date.now() - startTime
    throw error
  }
}

/**
 * Middleware wrapper for tracking page renders
 */
export function withPerformanceTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  pagePath: string
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now()
    try {
      const result = await fn(...args)
      const durationMs = Date.now() - startTime
      performanceTracker.trackPageRender(pagePath, durationMs, {
        success: true
      })
      return result
    } catch (error) {
      const durationMs = Date.now() - startTime
      performanceTracker.trackPageRender(pagePath, durationMs, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      performanceTracker.trackError(
        error instanceof Error ? error : new Error(String(error)),
        pagePath
      )
      throw error
    }
  }) as T
}

