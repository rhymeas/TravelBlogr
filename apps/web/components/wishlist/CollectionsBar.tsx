"use client"

import { useEffect, useState } from 'react'
import { Plus, Plane, Folder, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Collection { id: string; name: string; description?: string }

export function CollectionsBar() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const router = useRouter()

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/wishlist/collections', { cache: 'no-store' })
      const json = await res.json()
      setCollections(Array.isArray(json.collections) ? json.collections : [])
    } catch {
      toast.error('Failed to load collections')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const onCreate = async () => {
    const name = prompt('Collection name')?.trim()
    if (!name) return
    try {
      setCreating(true)
      const res = await fetch('/api/wishlist/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to create')
      setCollections(prev => [data.collection, ...prev])
      toast.success('Collection created')
    } catch (e: any) {
      toast.error(e?.message || 'Could not create collection')
    } finally {
      setCreating(false)
    }
  }

  const onGenerate = async (id: string, name: string) => {
    const daysRaw = prompt(`How many days for "${name}"? (default 7)`, '7')
    const days = Math.max(2, Math.min(30, Number(daysRaw) || 7))
    try {
      const res = await fetch(`/api/wishlist/collections/${id}/generate-trip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to generate trip')
      toast.success('Trip created from collection!')
      // Redirect to editor for the new trip
      if (json?.tripSlug) {
        router.push(`/dashboard/trips/${json.tripSlug}/edit`)
      } else {
        router.push('/dashboard/trips')
      }
    } catch (e: any) {
      toast.error(e?.message || 'Could not generate trip')
    }
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-semibold text-gray-800">Collections</span>
        </div>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full"
          disabled={creating}
        >
          {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Plus className="h-3.5 w-3.5"/>}
          New
        </button>
      </div>
      {loading ? (
        <div className="text-sm text-gray-500">Loading collections…</div>
      ) : collections.length === 0 ? (
        <div className="text-sm text-gray-500">No collections yet. Create one to organize your wishlist.</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {collections.map((c) => (
            <div key={c.id} className="inline-flex items-center gap-2 px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-full">
              <span className="font-medium text-gray-800">{c.name}</span>
              <button
                onClick={() => onGenerate(c.id, c.name)}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full"
                title="Create Trip from Collection"
              >
                <Plane className="h-3.5 w-3.5" />
                Generate Trip
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

