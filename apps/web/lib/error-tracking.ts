/**
 * Error Tracking Utility
 * 
 * Centralized error logging and tracking.
 * Can be integrated with Sentry, LogRocket, or other services later.
 */

export interface ErrorContext {
  userId?: string
  tripId?: string
  locationId?: string
  activityId?: string
  feature?: string
  action?: string
  [key: string]: any
}

export interface ErrorReport {
  message: string
  error: Error | unknown
  context?: ErrorContext
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
}

/**
 * Track an error with context
 * 
 * @example
 * ```typescript
 * try {
 *   await likeTrip(tripId)
 * } catch (error) {
 *   trackError('Failed to like trip', error, {
 *     userId: user.id,
 *     tripId,
 *     feature: 'likes',
 *     action: 'toggle_like'
 *   })
 * }
 * ```
 */
export function trackError(
  message: string,
  error: Error | unknown,
  context?: ErrorContext,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
) {
  const errorReport: ErrorReport = {
    message,
    error,
    context,
    timestamp: new Date(),
    severity
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('🔴 Error tracked:', {
      message,
      error,
      context,
      severity
    })
  }

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with Sentry, LogRocket, or other service
    // Example:
    // Sentry.captureException(error, {
    //   tags: { feature: context?.feature, action: context?.action },
    //   user: { id: context?.userId },
    //   extra: context
    // })
    
    // For now, log to console (Railway logs will capture this)
    console.error('[ERROR]', JSON.stringify({
      message,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      context,
      severity,
      timestamp: errorReport.timestamp.toISOString()
    }))
  }

  // Store in local error log (optional)
  storeErrorLocally(errorReport)
}

/**
 * Track a warning (non-critical error)
 */
export function trackWarning(
  message: string,
  context?: ErrorContext
) {
  trackError(message, new Error(message), context, 'low')
}

/**
 * Track a critical error (requires immediate attention)
 */
export function trackCriticalError(
  message: string,
  error: Error | unknown,
  context?: ErrorContext
) {
  trackError(message, error, context, 'critical')
}

/**
 * Store error locally for debugging
 * (useful for offline debugging or when error service is down)
 */
function storeErrorLocally(errorReport: ErrorReport) {
  try {
    if (typeof window === 'undefined') return // Server-side

    const errors = getLocalErrors()
    errors.push(errorReport)

    // Keep only last 50 errors
    const recentErrors = errors.slice(-50)

    localStorage.setItem('error_log', JSON.stringify(recentErrors))
  } catch (error) {
    // Silently fail if localStorage is not available
    console.warn('Failed to store error locally:', error)
  }
}

/**
 * Get locally stored errors
 */
export function getLocalErrors(): ErrorReport[] {
  try {
    if (typeof window === 'undefined') return []

    const stored = localStorage.getItem('error_log')
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    return []
  }
}

/**
 * Clear local error log
 */
export function clearLocalErrors() {
  try {
    if (typeof window === 'undefined') return

    localStorage.removeItem('error_log')
  } catch (error) {
    console.warn('Failed to clear error log:', error)
  }
}

/**
 * Get error statistics
 */
export function getErrorStats() {
  const errors = getLocalErrors()

  return {
    total: errors.length,
    bySeverity: {
      low: errors.filter(e => e.severity === 'low').length,
      medium: errors.filter(e => e.severity === 'medium').length,
      high: errors.filter(e => e.severity === 'high').length,
      critical: errors.filter(e => e.severity === 'critical').length
    },
    byFeature: errors.reduce((acc, e) => {
      const feature = e.context?.feature || 'unknown'
      acc[feature] = (acc[feature] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    recent: errors.slice(-10)
  }
}

/**
 * Helper to create user-friendly error messages
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return 'Network error. Please check your connection and try again.'
    }

    // Authentication errors
    if (error.message.includes('unauthorized') || error.message.includes('auth')) {
      return 'Please sign in to continue.'
    }

    // Rate limit errors
    if (error.message.includes('rate limit') || error.message.includes('too many')) {
      return 'Too many requests. Please slow down and try again.'
    }

    // Database errors
    if (error.message.includes('database') || error.message.includes('query')) {
      return 'Database error. Please try again later.'
    }

    // Generic error
    return 'Something went wrong. Please try again.'
  }

  return 'An unexpected error occurred.'
}

/**
 * Wrap async function with error tracking
 * 
 * @example
 * ```typescript
 * const likeTrip = withErrorTracking(
 *   async (tripId: string) => {
 *     await fetch(`/api/trips/${tripId}/like`, { method: 'POST' })
 *   },
 *   { feature: 'likes', action: 'toggle_like' }
 * )
 * ```
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: ErrorContext
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (error) {
      trackError(`Error in ${fn.name || 'anonymous function'}`, error, context)
      throw error
    }
  }) as T
}

