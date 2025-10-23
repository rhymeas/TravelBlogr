/**
 * Upstash Real-Time Features
 * 
 * Pub/Sub infrastructure for real-time updates across the app:
 * - Comments (trips, locations, posts)
 * - Ratings (locations)
 * - Likes (trips)
 * - Saves (trips)
 * - Presence (active viewers)
 * - Gallery (image uploads)
 */

import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

// ============================================
// TYPE DEFINITIONS
// ============================================

export type EntityType = 'trip' | 'location' | 'post' | 'blog'

export interface CommentEvent {
  action: 'new_comment' | 'delete_comment' | 'edit_comment'
  comment?: any
  commentId?: string
  timestamp: number
}

export interface RatingEvent {
  action: 'rating_updated'
  averageRating: number
  ratingCount: number
  timestamp: number
}

export interface LikeEvent {
  action: 'like' | 'unlike'
  count: number
  userId: string
  timestamp: number
}

export interface SaveEvent {
  action: 'save' | 'unsave'
  count: number
  userId: string
  timestamp: number
}

export interface PresenceEvent {
  action: 'viewer_joined' | 'viewer_left' | 'viewer_update'
  count: number
  viewers: string[] // User IDs
  timestamp: number
}

export interface ImageEvent {
  action: 'image_added' | 'image_deleted' | 'featured_changed'
  imageUrl: string
  userId?: string
  timestamp: number
}

// ============================================
// CHANNEL HELPERS
// ============================================

export const Channels = {
  comments: (type: EntityType, id: string) => `${type}:${id}:comments`,
  rating: (type: EntityType, id: string) => `${type}:${id}:rating`,
  likes: (type: EntityType, id: string) => `${type}:${id}:likes`,
  saves: (type: EntityType, id: string) => `${type}:${id}:saves`,
  presence: (type: EntityType, id: string) => `${type}:${id}:presence`,
  images: (type: EntityType, id: string) => `${type}:${id}:images`,
}

// ============================================
// COMMENTS
// ============================================

/**
 * Publish new comment event
 */
export async function publishComment(
  type: EntityType,
  id: string,
  comment: any
): Promise<void> {
  const channel = Channels.comments(type, id)
  const event: CommentEvent = {
    action: 'new_comment',
    comment,
    timestamp: Date.now()
  }

  // Use Redis List for message queue (works with Upstash REST API)
  const messageKey = `messages:${channel}`
  await redis.lpush(messageKey, JSON.stringify(event))
  await redis.ltrim(messageKey, 0, 99) // Keep last 100 messages
  await redis.expire(messageKey, 3600) // Expire after 1 hour

  console.log(`📢 Published new comment to ${channel}`)
}

/**
 * Publish comment delete event
 */
export async function publishCommentDelete(
  type: EntityType,
  id: string,
  commentId: string
): Promise<void> {
  const channel = Channels.comments(type, id)
  const event: CommentEvent = {
    action: 'delete_comment',
    commentId,
    timestamp: Date.now()
  }

  const messageKey = `messages:${channel}`
  await redis.lpush(messageKey, JSON.stringify(event))
  await redis.ltrim(messageKey, 0, 99)
  await redis.expire(messageKey, 3600)

  console.log(`📢 Published comment delete to ${channel}`)
}

/**
 * Publish comment edit event
 */
export async function publishCommentEdit(
  type: EntityType,
  id: string,
  comment: any
): Promise<void> {
  const channel = Channels.comments(type, id)
  const event: CommentEvent = {
    action: 'edit_comment',
    comment,
    timestamp: Date.now()
  }

  const messageKey = `messages:${channel}`
  await redis.lpush(messageKey, JSON.stringify(event))
  await redis.ltrim(messageKey, 0, 99)
  await redis.expire(messageKey, 3600)

  console.log(`📢 Published comment edit to ${channel}`)
}

// ============================================
// RATINGS
// ============================================

/**
 * Publish rating update event
 */
export async function publishRating(
  type: EntityType,
  id: string,
  data: { averageRating: number; ratingCount: number }
): Promise<void> {
  const channel = Channels.rating(type, id)
  const event: RatingEvent = {
    action: 'rating_updated',
    averageRating: data.averageRating,
    ratingCount: data.ratingCount,
    timestamp: Date.now()
  }

  const messageKey = `messages:${channel}`
  await redis.lpush(messageKey, JSON.stringify(event))
  await redis.ltrim(messageKey, 0, 99)
  await redis.expire(messageKey, 3600)

  console.log(`📢 Published rating update to ${channel}`)
}

// ============================================
// LIKES
// ============================================

/**
 * Publish like event
 */
export async function publishLike(
  type: EntityType,
  id: string,
  data: { count: number; action: 'like' | 'unlike'; userId: string }
): Promise<void> {
  const channel = Channels.likes(type, id)
  const event: LikeEvent = {
    action: data.action,
    count: data.count,
    userId: data.userId,
    timestamp: Date.now()
  }

  const messageKey = `messages:${channel}`
  await redis.lpush(messageKey, JSON.stringify(event))
  await redis.ltrim(messageKey, 0, 99)
  await redis.expire(messageKey, 3600)

  console.log(`📢 Published ${data.action} to ${channel}`)
}

// ============================================
// SAVES
// ============================================

/**
 * Publish save event
 */
export async function publishSave(
  type: EntityType,
  id: string,
  data: { count: number; action: 'save' | 'unsave'; userId: string }
): Promise<void> {
  const channel = Channels.saves(type, id)
  const event: SaveEvent = {
    action: data.action,
    count: data.count,
    userId: data.userId,
    timestamp: Date.now()
  }

  const messageKey = `messages:${channel}`
  await redis.lpush(messageKey, JSON.stringify(event))
  await redis.ltrim(messageKey, 0, 99)
  await redis.expire(messageKey, 3600)

  console.log(`📢 Published ${data.action} to ${channel}`)
}

// ============================================
// PRESENCE
// ============================================

/**
 * Publish presence event
 */
export async function publishPresence(
  type: EntityType,
  id: string,
  data: { count: number; viewers: string[]; action: PresenceEvent['action'] }
): Promise<void> {
  const channel = Channels.presence(type, id)
  const event: PresenceEvent = {
    action: data.action,
    count: data.count,
    viewers: data.viewers,
    timestamp: Date.now()
  }

  const messageKey = `messages:${channel}`
  await redis.lpush(messageKey, JSON.stringify(event))
  await redis.ltrim(messageKey, 0, 99)
  await redis.expire(messageKey, 3600)

  console.log(`📢 Published presence update to ${channel}: ${data.count} viewers`)
}

// ============================================
// IMAGES
// ============================================

/**
 * Publish image event
 */
export async function publishImageUpdate(
  type: EntityType,
  id: string,
  data: { action: ImageEvent['action']; imageUrl: string; userId?: string }
): Promise<void> {
  const channel = Channels.images(type, id)
  const event: ImageEvent = {
    action: data.action,
    imageUrl: data.imageUrl,
    userId: data.userId,
    timestamp: Date.now()
  }

  const messageKey = `messages:${channel}`
  await redis.lpush(messageKey, JSON.stringify(event))
  await redis.ltrim(messageKey, 0, 99)
  await redis.expire(messageKey, 3600)

  console.log(`📢 Published ${data.action} to ${channel}`)
}

// ============================================
// PRESENCE TRACKING
// ============================================

/**
 * Track viewer presence
 * Adds user to sorted set with current timestamp
 */
export async function trackViewer(
  type: EntityType,
  id: string,
  userId: string
): Promise<number> {
  const key = `presence:${type}:${id}`
  
  // Add user with current timestamp as score
  await redis.zadd(key, { score: Date.now(), member: userId })
  
  // Set expiry to 5 minutes
  await redis.expire(key, 300)
  
  // Get active viewers (last 5 minutes)
  const now = Date.now()
  const fiveMinutesAgo = now - 300000
  const viewers = await redis.zrange(key, fiveMinutesAgo, now, { byScore: true })
  
  // Publish presence update
  const viewerIds = (viewers as string[]).slice(0, 10) // First 10 for avatars
  await publishPresence(type, id, {
    action: 'viewer_update',
    count: viewers.length,
    viewers: viewerIds
  })

  return viewers.length
}

/**
 * Get active viewers
 */
export async function getActiveViewers(
  type: EntityType,
  id: string
): Promise<string[]> {
  const key = `presence:${type}:${id}`
  const now = Date.now()
  const fiveMinutesAgo = now - 300000

  const viewers = await redis.zrange(key, fiveMinutesAgo, now, { byScore: true })
  return viewers as string[]
}

/**
 * Remove viewer
 */
export async function removeViewer(
  type: EntityType,
  id: string,
  userId: string
): Promise<void> {
  const key = `presence:${type}:${id}`
  await redis.zrem(key, userId)
  
  // Get remaining viewers
  const viewers = await getActiveViewers(type, id)
  
  // Publish presence update
  await publishPresence(type, id, {
    action: 'viewer_left',
    count: viewers.length,
    viewers: viewers.slice(0, 10)
  })
}

