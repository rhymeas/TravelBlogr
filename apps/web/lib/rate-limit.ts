/**
 * Rate Limiting Utility
 * 
 * Uses Upstash Redis for distributed rate limiting.
 * Protects API routes from abuse and spam.
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Initialize Redis client
const redis = Redis.fromEnv()

/**
 * Rate limiters for different API endpoints
 */

// Like/Unlike actions - 10 requests per minute per user
export const likeRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'ratelimit:like'
})

// Save/Unsave actions - 10 requests per minute per user
export const saveRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'ratelimit:save'
})

// Comment posting - 5 comments per minute per user
export const commentRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: 'ratelimit:comment'
})

// Rating actions - 3 ratings per minute per user
export const ratingRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 m'),
  analytics: true,
  prefix: 'ratelimit:rating'
})

// General API - 100 requests per minute per IP
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'ratelimit:api'
})

/**
 * Helper function to get identifier from request
 * Uses user ID if authenticated, otherwise IP address
 */
export function getIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }
  
  // Get IP from headers (works with Vercel, Railway, etc.)
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'anonymous'
  
  return `ip:${ip}`
}

/**
 * Apply rate limit to a request
 * 
 * @example
 * ```typescript
 * const { success, remaining } = await applyRateLimit(
 *   request,
 *   likeRateLimit,
 *   user?.id
 * )
 * 
 * if (!success) {
 *   return NextResponse.json(
 *     { error: 'Too many requests' },
 *     { status: 429, headers: { 'X-RateLimit-Remaining': remaining.toString() } }
 *   )
 * }
 * ```
 */
export async function applyRateLimit(
  request: Request,
  ratelimit: Ratelimit,
  userId?: string
) {
  const identifier = getIdentifier(request, userId)
  const result = await ratelimit.limit(identifier)
  
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    identifier
  }
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(result: {
  limit: number
  remaining: number
  reset: number
}) {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString()
  }
}

