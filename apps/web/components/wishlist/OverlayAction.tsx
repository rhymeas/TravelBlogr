"use client"

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Check, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface OverlayActionProps {
  slug: string
  variant: 'wishlist' | 'visited'
}

/**
 * Small top-right overlay action for list cards to remove (wishlist) or unmark (visited).
 * - Calls our server API: /api/locations/[slug]/customize (PATCH)
 * - Uses router.refresh() to re-fetch the server component list after success
 */
export function OverlayAction({ slug, variant }: OverlayActionProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [loading, setLoading] = useState(false)

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      setLoading(true)
      const body = variant === 'wishlist' ? { isWishlisted: false } : { isVisited: false }

      const res = await fetch(`/api/locations/${slug}/customize`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const msg = variant === 'wishlist' ? 'Failed to remove from wishlist' : 'Failed to unmark visited'
        toast.error(msg)
        return
      }

      toast.success(variant === 'wishlist' ? 'Removed from wishlist' : 'Marked as not visited')
      startTransition(() => router.refresh())
    } catch (err) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const label = variant === 'wishlist' ? 'Remove' : 'Unmark'

  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          // Trigger the same behavior as click (async to avoid double handling)
          (async () => { await handleClick(e as unknown as React.MouseEvent<HTMLButtonElement>) })()
        }
      }}
      disabled={loading || pending}
      aria-label={label}
      aria-busy={loading || pending}
      className="absolute top-3 right-3 bg-white/95 hover:bg-white text-xs text-gray-800 border border-gray-200 rounded-full px-2.5 py-1 shadow-sm backdrop-blur-sm flex items-center gap-1 transition-colors"
      title={label}
    >
      {variant === 'wishlist' ? <Heart className="h-3.5 w-3.5 text-red-600" /> : <Check className="h-3.5 w-3.5 text-green-600" />}
      <span className="font-medium">{label}</span>
      {(loading || pending) ? <Loader2 className="h-3.5 w-3.5 text-gray-400 animate-spin" /> : null}
    </button>
  )
}

