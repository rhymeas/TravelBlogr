/**
 * Test Upstash Redis Connection
 * 
 * Visit: http://localhost:3000/api/test-upstash
 */

import { NextResponse } from 'next/server'
import { getUpstashRedis, getCached, setCached, checkRateLimit, CacheKeys, CacheTTL } from '@/lib/upstash'

export async function GET() {
  try {
    const redis = getUpstashRedis()
    
    // Test 1: Basic SET/GET
    console.log('🧪 Test 1: Basic SET/GET')
    await redis.set('test:hello', 'world', { ex: 60 })
    const value = await redis.get('test:hello')
    console.log('✅ Test 1 passed:', value === 'world' ? 'SUCCESS' : 'FAILED')
    
    // Test 2: Helper functions
    console.log('🧪 Test 2: Helper functions (getCached/setCached)')
    await setCached('test:user', { name: 'John', age: 30 }, 60)
    const user = await getCached<{ name: string; age: number }>('test:user')
    console.log('✅ Test 2 passed:', user?.name === 'John' ? 'SUCCESS' : 'FAILED')
    
    // Test 3: Rate limiting
    console.log('🧪 Test 3: Rate limiting')
    const limit1 = await checkRateLimit('test:api:user123', 5, 60)
    const limit2 = await checkRateLimit('test:api:user123', 5, 60)
    console.log('✅ Test 3 passed:', limit1.allowed && limit2.allowed ? 'SUCCESS' : 'FAILED')
    console.log('   Remaining:', limit2.remaining, '/', 5)
    
    // Test 4: Cache keys
    console.log('🧪 Test 4: Cache key builders')
    const imageKey = CacheKeys.image('Tokyo')
    const weatherKey = CacheKeys.weather('Paris')
    console.log('✅ Test 4 passed:', imageKey === 'image:Tokyo' && weatherKey === 'weather:Paris' ? 'SUCCESS' : 'FAILED')
    
    return NextResponse.json({
      success: true,
      message: 'Upstash Redis is working!',
      tests: {
        basicSetGet: value === 'world',
        helperFunctions: user?.name === 'John',
        rateLimiting: limit1.allowed && limit2.allowed,
        cacheKeys: imageKey === 'image:Tokyo' && weatherKey === 'weather:Paris'
      },
      rateLimitInfo: {
        allowed: limit2.allowed,
        remaining: limit2.remaining,
        resetAt: new Date(limit2.resetAt).toISOString()
      }
    })
  } catch (error) {
    console.error('❌ Upstash Redis test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

