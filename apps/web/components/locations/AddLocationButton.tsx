"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Loader2, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

export function AddLocationButton() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/auto-fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ locationName: name.trim() })
      })

      const data = await res.json()
      if (!res.ok || !data?.success) {
        // 409 duplicate? Offer to navigate
        if (res.status === 409 && data?.existingLocation?.slug) {
          toast('Location already exists. Opening…', { icon: 'ℹ️' })
          router.push(`/locations/${data.existingLocation.slug}`)
          setOpen(false)
          return
        }
        setError(data?.error || 'Failed to create location')
        return
      }

      const slug = data?.location?.slug || data?.data?.slug
      toast.success('Location created!')
      setOpen(false)
      if (slug) router.push(`/locations/${slug}`)
      else router.refresh()
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="ml-auto inline-flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Add Location
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!loading) setOpen(v) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a new location</DialogTitle>
            <DialogDescription>
              Enter a location name (e.g., "Paris, France" or "Tokyo, Japan"). We will generate details automatically.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Banff, Canada"
              autoFocus
              disabled={loading}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
              <Button type="submit" disabled={loading || !name.trim()}>
                {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Creating…</>) : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

