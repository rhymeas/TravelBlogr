"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { SmartImage as Image } from '@/components/ui/SmartImage'
import { getBrowserSupabase } from '@/lib/supabase'

interface TripFeedImage {
  id: string
  image_url: string
  caption?: string | null
  location_name?: string | null
  created_at: string
  user_id: string
  user?: {
    id: string
    full_name?: string | null
    username?: string | null
    avatar_url?: string | null
  }
}

const LIMIT = 24

export function TripFeedGallery({ tripId, isTripOwner = false }: { tripId: string, isTripOwner?: boolean }) {
  const [images, setImages] = useState<TripFeedImage[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const loadingRef = useRef(false)
  const seenIds = useRef<Set<string>>(new Set())
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

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
      const res = await fetch(`/api/trips/${tripId}/feed/images?limit=${LIMIT}&offset=${pageOffset}`,
        { credentials: 'include', cache: 'no-store' })
      const json = await res.json()
      const list: TripFeedImage[] = Array.isArray(json?.images) ? json.images : []

      // Append with de-duplication
      setImages(prev => {
        const next = reset ? [] : [...prev]
        for (const item of list) {
          if (!seenIds.current.has(item.id)) {
            seenIds.current.add(item.id)
            next.push(item)
          }
        }
        return next
      })

      setHasMore(list.length === LIMIT)
      setOffset(pageOffset + list.length)
    } catch (e) {
      console.error('Failed to load trip feed images', e)
    } finally {
      loadingRef.current = false
      setLoading(false)
      setLoadingMore(false)
    }
  }, [tripId, offset])

  // Initial and tripId changes
  useEffect(() => {
    loadPage(true)
  }, [tripId, loadPage])

  // Fetch current user id for delete permissions
  useEffect(() => {
    (async () => {
      try {
        const supabase = getBrowserSupabase()
        const { data } = await supabase.auth.getUser()
        setCurrentUserId(data?.user?.id ?? null)
      } catch {}
    })()
  }, [])

  // Infinite scroll observer
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

  // Real-time: listen for new images on this trip
  useEffect(() => {
    const supabase = getBrowserSupabase()
    const channel = supabase
      .channel(`trip-feed:${tripId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'trip_feed_images', filter: `trip_id=eq.${tripId}` },
        (payload) => {
          const row = payload.new as TripFeedImage
          if (!row?.id) return
          if (!seenIds.current.has(row.id)) {
            seenIds.current.add(row.id)
            setImages(prev => [row, ...prev])
            setOffset(prev => prev + 1)
          }
        }
      )
      .subscribe()

    return () => {
      try { supabase.removeChannel(channel) } catch {}
    }
  }, [tripId])

  if (loading && images.length === 0) {
    return <div className="text-sm text-gray-500">Loading trip moments…</div>
  }

  if (!loading && images.length === 0) {
    return <div className="text-sm text-gray-500">No photos yet. Be the first to share a moment from this trip.</div>
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {images.map((img) => (
          <div key={img.id} className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 group">
            <Image src={img.image_url} alt={img.caption || 'Trip photo'} fill className="object-cover" />
            {(isTripOwner || currentUserId === img.user_id) && (
              <button
                aria-label="Delete photo"
                onClick={async (e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const ok = window.confirm('Delete this photo?')
                  if (!ok) return
                  try {
                    const res = await fetch(`/api/trips/${tripId}/feed/images/${img.id}`, {
                      method: 'DELETE',
                      credentials: 'include'
                    })
                    if (res.ok) {
                      setImages(prev => prev.filter(it => it.id !== img.id))
                      seenIds.current.delete(img.id)
                    } else {
                      console.error('Failed to delete image')
                    }
                  } catch (err) {
                    console.error('Failed to delete image', err)
                  }
                }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-1 rounded bg-black/60 text-white"
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
      {/* sentinel */}
      <div ref={sentinelRef} className="h-10" />
      {loadingMore && (
        <div className="text-center text-xs text-gray-500 py-2">Loading more…</div>
      )}
      {!hasMore && images.length > 0 && (
        <div className="text-center text-xs text-gray-400 py-2">You've reached the end</div>
      )}
    </>
  )
}
