'use client'

/**
 * Custom hooks for fetching blog data
 * 
 * Provides React hooks for fetching blog posts, destinations, testimonials, and stats.
 * Uses SWR for caching and revalidation.
 */

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

/**
 * Fetch blog posts
 */
export function useBlogPosts(params?: {
  status?: string
  category?: string
  tag?: string
  limit?: number
  offset?: number
}) {
  const queryParams = new URLSearchParams()
  if (params?.status) queryParams.set('status', params.status)
  if (params?.category) queryParams.set('category', params.category)
  if (params?.tag) queryParams.set('tag', params.tag)
  if (params?.limit) queryParams.set('limit', params.limit.toString())
  if (params?.offset) queryParams.set('offset', params.offset.toString())

  const url = `/api/blog/posts${queryParams.toString() ? `?${queryParams}` : ''}`

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000 // 1 minute
  })

  return {
    posts: data?.posts || [],
    total: data?.total || 0,
    isLoading,
    error,
    mutate
  }
}

/**
 * Fetch a single blog post
 */
export function useBlogPost(idOrSlug: string | null) {
  const url = idOrSlug ? `/api/blog/posts/${idOrSlug}` : null

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000
  })

  return {
    post: data || null,
    isLoading,
    error,
    mutate
  }
}

/**
 * Fetch blog destinations
 */
export function useBlogDestinations(params?: {
  trending?: boolean
  featured?: boolean
  limit?: number
}) {
  const queryParams = new URLSearchParams()
  if (params?.trending) queryParams.set('trending', 'true')
  if (params?.featured) queryParams.set('featured', 'true')
  if (params?.limit) queryParams.set('limit', params.limit.toString())

  const url = `/api/blog/destinations${queryParams.toString() ? `?${queryParams}` : ''}`

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000 // 5 minutes
  })

  return {
    destinations: data?.destinations || [],
    isLoading,
    error,
    mutate
  }
}

/**
 * Fetch blog testimonials
 */
export function useBlogTestimonials(params?: {
  featured?: boolean
  limit?: number
}) {
  const queryParams = new URLSearchParams()
  if (params?.featured) queryParams.set('featured', 'true')
  if (params?.limit) queryParams.set('limit', params.limit.toString())

  const url = `/api/blog/testimonials${queryParams.toString() ? `?${queryParams}` : ''}`

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000 // 5 minutes
  })

  return {
    testimonials: data?.testimonials || [],
    isLoading,
    error,
    mutate
  }
}

/**
 * Fetch blog stats
 */
export function useBlogStats() {
  const { data, error, isLoading, mutate } = useSWR('/api/blog/stats', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 600000 // 10 minutes
  })

  return {
    stats: data?.stats || [],
    isLoading,
    error,
    mutate
  }
}

/**
 * Example Usage:
 * 
 * // Fetch all published posts
 * const { posts, isLoading } = useBlogPosts({ status: 'published', limit: 10 })
 * 
 * // Fetch single post by slug
 * const { post, isLoading } = useBlogPost('my-blog-post-slug')
 * 
 * // Fetch trending destinations
 * const { destinations, isLoading } = useBlogDestinations({ trending: true, limit: 6 })
 * 
 * // Fetch featured testimonials
 * const { testimonials, isLoading } = useBlogTestimonials({ featured: true, limit: 3 })
 * 
 * // Fetch homepage stats
 * const { stats, isLoading } = useBlogStats()
 */

