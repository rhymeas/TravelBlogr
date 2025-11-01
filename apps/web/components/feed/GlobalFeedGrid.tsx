"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'

interface GlobalFeedItem {
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

const LIMIT = 48

export function GlobalFeedGrid() {
  const [items, setItems] = useState<GlobalFeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const loadingRef = useRef(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const seenIds = useRef<Set<string>>(new Set())

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
      const res = await fetch(`/api/feed/global?limit=${LIMIT}&offset=${pageOffset}`, { cache: 'no-store' })
      const json = await res.json()
      const list: GlobalFeedItem[] = Array.isArray(json?.images) ? json.images : []

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
      console.error('Failed to load global feed', e)
    } finally {
      loadingRef.current = false
      setLoading(false)
      setLoadingMore(false)
    }
  }, [offset])

  // Initial
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
      <div className="text-center text-sm text-gray-500 py-6">Loading public moments…</div>
    )
  }

  if (!loading && items.length === 0) {
    return (
      <div className="text-center text-sm text-gray-500 py-6">No public moments yet.</div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {items.map((it) => {
          const href = it.trip?.slug ? `/trips/${it.trip.slug}` : undefined
          const content = (
            <div className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.image_url}
                alt={it.caption || 'Trip moment'}
                className="w-full h-full object-cover"
                onError={async (e) => {
                  const el = e.currentTarget as HTMLImageElement
                  if ((el as any)._retried) return
                  ;(el as any)._retried = true
                  try {
                    const res = await fetch(`/api/storage/signed-read?imageId=${encodeURIComponent(it.id)}`)
                    const json = await res.json()
                    if (json?.signedUrl) {
                      el.src = json.signedUrl
                    }
                  } catch {}
                }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
              {(it.caption || it.user?.username) && (
                <div className="absolute inset-x-0 bottom-0 p-2 text-[11px] text-white/90 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="truncate">{it.caption}</div>
                  {it.user?.username && (
                    <div className="text-white/70">by <Link href={`/u/${it.user.username}`} className="underline">@{it.user.username}</Link></div>
                  )}
                </div>
              )}
            </div>
          )
          return href ? (
            <Link href={href} key={it.id} prefetch={false} aria-label={it.trip?.title || 'Trip'}>
              {content}
            </Link>
          ) : (
            <div key={it.id}>{content}</div>
          )
        })}
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
