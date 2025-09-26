'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'

// Types for featured content
export interface FeaturedTrip {
  id: string
  title: string
  description?: string
  slug: string
  cover_image?: string
  start_date?: string
  end_date?: string
  location_data?: any
  created_at: string
  author: {
    id: string
    full_name: string
    avatar_url?: string
    username?: string
  }
  posts: Array<{
    id: string
    title: string
    excerpt?: string
    featured_image?: string
    post_date: string
    view_count: number
    like_count: number
  }>
  postsCount: number
  duration?: number
  totalDistance?: number
  type: 'trip'
}

export interface FeaturedLocation {
  id: string
  name: string
  slug: string
  description?: string
  country: string
  region?: string
  city?: string
  latitude?: number
  longitude?: number
  featured_image?: string
  gallery_images?: string[]
  rating?: number
  visit_count: number
  best_time_to_visit?: string
  location_posts: Array<{
    id: string
    title: string
    excerpt?: string
    featured_image?: string
    published_at: string
    view_count: number
    like_count: number
    author: {
      id: string
      full_name: string
      avatar_url?: string
    }
  }>
  location_tips: Array<{
    id: string
    category: string
    title: string
    content: string
    is_featured: boolean
  }>
  postsCount: number
  featuredTips: Array<any>
  type: 'location'
}

export interface FeaturedCMSPost {
  id: string
  title: string
  slug: string
  excerpt?: string
  featured_image?: string
  tags: string[]
  category?: string
  published_at: string
  view_count: number
  like_count: number
  author: {
    id: string
    full_name: string
    avatar_url?: string
    username?: string
  }
  type: 'cms_post'
  postsCount: number
}

export interface RecentPost {
  id: string
  title: string
  excerpt?: string
  featured_image?: string
  published_at: string
  view_count: number
  like_count: number
  type: 'trip_post' | 'cms_post'
  author: {
    id: string
    full_name: string
    avatar_url?: string
    username?: string
  }
  trip?: {
    id: string
    title: string
    slug: string
  }
  category?: string
}

export interface FeaturedContentResponse {
  trips: FeaturedTrip[]
  locations: FeaturedLocation[]
  cmsContent: FeaturedCMSPost[]
  recentPosts: RecentPost[]
  meta: {
    tripsCount: number
    locationsCount: number
    cmsPostsCount: number
    recentPostsCount: number
    lastUpdated: string
  }
}

// SWR fetcher function
const fetcher = (url: string) => fetch(url).then(res => res.json())

// Custom hook for featured content
export function useFeaturedContent() {
  const { data, error, isLoading, mutate } = useSWR<FeaturedContentResponse>(
    '/api/featured',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes
      dedupingInterval: 2 * 60 * 1000, // Dedupe requests for 2 minutes
    }
  )

  return {
    data,
    trips: data?.trips || [],
    locations: data?.locations || [],
    cmsContent: data?.cmsContent || [],
    recentPosts: data?.recentPosts || [],
    meta: data?.meta,
    isLoading,
    error,
    mutate
  }
}

// Custom hook for landing page statistics
export interface LandingStats {
  totalTrips: number
  totalDestinations: number
  totalStories: number
  totalTravelers: number
  totalDistance: number
  totalPhotos: number
}

export function useLandingStats() {
  const { data, error, isLoading, mutate } = useSWR<LandingStats>(
    '/api/stats/landing',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes
      dedupingInterval: 2 * 60 * 1000, // Dedupe requests for 2 minutes
    }
  )

  return {
    stats: data,
    isLoading,
    error,
    mutate
  }
}

// Custom hook for CMS featured content management (admin only)
export function useCMSFeaturedContent() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/cms/featured',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 10 * 60 * 1000, // Refresh every 10 minutes
    }
  )

  const updateFeaturedStatus = async (postId: string, action: 'feature' | 'unfeature') => {
    try {
      const response = await fetch('/api/cms/featured', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId, action }),
      })

      if (!response.ok) {
        throw new Error('Failed to update featured status')
      }

      const result = await response.json()
      
      // Revalidate the data
      mutate()
      
      return result
    } catch (error) {
      console.error('Error updating featured status:', error)
      throw error
    }
  }

  return {
    data,
    posts: data?.posts || [],
    categories: data?.categories || [],
    tags: data?.tags || [],
    meta: data?.meta,
    isLoading,
    error,
    mutate,
    updateFeaturedStatus
  }
}
