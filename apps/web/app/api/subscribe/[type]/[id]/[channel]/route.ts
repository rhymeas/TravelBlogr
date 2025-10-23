/**
 * Server-Sent Events (SSE) Endpoint for Real-Time Updates
 * 
 * Usage:
 * - GET /api/subscribe/trip/123/comments - Subscribe to trip comments
 * - GET /api/subscribe/location/tokyo/rating - Subscribe to location ratings
 * - GET /api/subscribe/trip/123/likes - Subscribe to trip likes
 * - GET /api/subscribe/trip/123/saves - Subscribe to trip saves
 * - GET /api/subscribe/trip/123/presence - Subscribe to viewer presence
 * - GET /api/subscribe/location/tokyo/images - Subscribe to image updates
 */

import { NextRequest } from 'next/server'
import { Redis } from '@upstash/redis'
import { Channels, EntityType } from '@/lib/upstash-realtime'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

/**
 * GET /api/subscribe/[type]/[id]/[channel]
 * 
 * Subscribe to real-time updates via Server-Sent Events
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; id: string; channel: string } }
) {
  const { type, id, channel } = params

  // Validate type
  const validTypes: EntityType[] = ['trip', 'location', 'post', 'blog']
  if (!validTypes.includes(type as EntityType)) {
    return new Response('Invalid type', { status: 400 })
  }

  // Validate channel
  const validChannels = ['comments', 'rating', 'likes', 'saves', 'presence', 'images']
  if (!validChannels.includes(channel)) {
    return new Response('Invalid channel', { status: 400 })
  }

  // Get Redis channel name
  const redisChannel = Channels[channel as keyof typeof Channels](type as EntityType, id)

  console.log(`📡 SSE connection opened: ${redisChannel}`)

  // Create readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(`data: ${JSON.stringify({ type: 'connected', channel: redisChannel })}\n\n`)

      // Keep-alive interval (send comment every 30 seconds)
      const keepAliveInterval = setInterval(() => {
        controller.enqueue(`: keepalive\n\n`)
      }, 30000)

      // Use Redis List for message queue (LPUSH/BRPOP pattern)
      // This works better with Upstash REST API than traditional pub/sub
      const messageKey = `messages:${redisChannel}`
      let lastMessageId = Date.now()

      // Polling interval (check for new messages every 1 second)
      const pollingInterval = setInterval(async () => {
        try {
          // Get new messages from Redis list
          const messages = await redis.lrange(messageKey, 0, -1)

          if (messages && messages.length > 0) {
            // Send each message to client
            for (const message of messages) {
              try {
                const parsed = JSON.parse(message as string)

                // Only send messages newer than last seen
                if (parsed.timestamp > lastMessageId) {
                  controller.enqueue(`data: ${message}\n\n`)
                  lastMessageId = parsed.timestamp
                }
              } catch (e) {
                // Skip invalid messages
              }
            }

            // Keep only last 100 messages
            await redis.ltrim(messageKey, 0, 99)
          }
        } catch (error) {
          console.error('Polling error:', error)
        }
      }, 1000)

      // Cleanup on connection close
      request.signal.addEventListener('abort', () => {
        console.log(`📡 SSE connection closed: ${redisChannel}`)
        clearInterval(keepAliveInterval)
        clearInterval(pollingInterval)
        controller.close()
      })

    }
  })

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering in nginx
    }
  })
}

