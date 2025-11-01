"use client"

import { useCallback, useEffect, useRef, useState } from 'react'

interface FeedItem {
  id: string
  image_url: string
  caption?: string | null
  created_at: string
  user?: {
    username?: string | null
    full_name?: string | null
    avatar_url?: string | null
  }
  trip?: {
    slug?: string | null
    title?: string | null
  }
}

interface LocationFeedGridProps {
  slug?: string
  lat?: number
  lng?: number
  radiusKm?: number
}

const LIMIT = 48

export function LocationFeedGrid({ slug, lat, lng, radiusKm = 100 }: LocationFeedGridProps) {
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const loadingRef = useRef(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const seenIds = useRef<Set<string>>(new Set())

  const makeUrl = (nextOffset: number) => {
    const params = new URLSearchParams()
    params.set('limit', String(LIMIT))
    params.set('offset', String(nextOffset))
    params.set('radiusKm', String(radiusKm))
    if (slug) params.set('slug', slug)
    else if (lat != null && lng != null) {
      params.set('lat', String(lat))
      params.set('lng', String(lng))
    }
    return `/api/feed/location?${params.toString()}`
  }

  const loadPage = useCallback(async (reset = false) => {
    if (loadingRef.current) return
    loadingRef.current = true

    if (reset) {
      setLoading(true)
      setOffset(0)
      setHasMore(true)
      seenIds.current.clear()
    } else {
      setLoadingMore(true)
    }

    try {
      const pageOffset = reset ? 0 : offset
      const res = await fetch(makeUrl(pageOffset), { cache: 'no-store' })
      const json = await res.json()
      const list: FeedItem[] = Array.isArray(json?.images) ? json.images : []

      setItems(prev => {
        const next = reset ? [] : [...prev]
        for (const it of list) {
          if (!seenIds.current.has(it.id)) {
            seenIds.current.add(it.id)
            next.push(it)
          }
        }
        return next
      })

      setHasMore(list.length === LIMIT)
      setOffset(pageOffset + list.length)
    } catch (e) {
      console.error('Failed to load location feed', e)
    } finally {
      loadingRef.current = false
      setLoading(false)
      setLoadingMore(false)
    }
  }, [offset, radiusKm, slug, lat, lng])

  // Initial + refetch on params change
  useEffect(() => {
    loadPage(true)
  }, [loadPage])

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !loadingRef.current && hasMore) {
        loadPage(false)
      }
    }, { rootMargin: '300px' })

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loadPage])

  if (loading && items.length === 0) {
    return (
      <div className="text-center text-sm text-gray-500 py-6">Loading nearby moments…</div>
    )
  }

  if (!loading && items.length === 0) {
    return (
      <div className="text-center text-sm text-gray-500 py-6">No moments near this location yet.</div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {items.map((it) => (
          <div key={it.id} className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.image_url} alt={it.caption || 'Moment'} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
            {it.caption && (
              <div className="absolute inset-x-0 bottom-0 p-2 text-[11px] text-white/90 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="truncate">{it.caption}</div>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* sentinel */}
      <div ref={sentinelRef} className="h-10" />
      {loadingMore && (
        <div className="text-center text-xs text-gray-500 py-2">Loading more…</div>
      )}
      {!hasMore && items.length > 0 && (
        <div className="text-center text-xs text-gray-400 py-2">You've reached the end</div>
      )}
    </>
  )
}

