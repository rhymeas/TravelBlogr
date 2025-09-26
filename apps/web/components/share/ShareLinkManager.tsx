'use client'

import { useState, useEffect } from 'react'
import { Plus, Copy, Edit, Trash2, Eye, Settings, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CreateShareLinkModal } from './CreateShareLinkModal'
import { EditShareLinkModal } from './EditShareLinkModal'
import toast from 'react-hot-toast'

interface ShareLink {
  id: string
  subdomain: string
  token: string
  title: string
  description?: string
  is_active: boolean
  view_count: number
  created_at: string
  settings: any
  customization: any
}

interface ShareLinkManagerProps {
  tripId: string
}

export function ShareLinkManager({ tripId }: ShareLinkManagerProps) {
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingLink, setEditingLink] = useState<ShareLink | null>(null)

  useEffect(() => {
    fetchShareLinks()
  }, [tripId])

  const fetchShareLinks = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}/share-links`)
      if (!response.ok) throw new Error('Failed to fetch share links')
      
      const data = await response.json()
      setShareLinks(data.shareLinks || [])
    } catch (error) {
      console.error('Error fetching share links:', error)
      toast.error('Failed to load share links')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLink = async (linkData: any) => {
    try {
      const response = await fetch(`/api/trips/${tripId}/share-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(linkData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create share link')
      }

      const data = await response.json()
      setShareLinks(prev => [data.shareLink, ...prev])
      setShowCreateModal(false)
      toast.success('Share link created successfully!')
    } catch (error: any) {
      console.error('Error creating share link:', error)
      toast.error(error.message || 'Failed to create share link')
    }
  }

  const handleUpdateLink = async (linkId: string, updates: any) => {
    try {
      const response = await fetch(`/api/trips/${tripId}/share-links`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ linkId, updates })
      })

      if (!response.ok) throw new Error('Failed to update share link')

      const data = await response.json()
      setShareLinks(prev => prev.map(link => 
        link.id === linkId ? data.shareLink : link
      ))
      setEditingLink(null)
      toast.success('Share link updated successfully!')
    } catch (error) {
      console.error('Error updating share link:', error)
      toast.error('Failed to update share link')
    }
  }

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('Are you sure you want to delete this share link? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/trips/${tripId}/share-links?linkId=${linkId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete share link')

      setShareLinks(prev => prev.filter(link => link.id !== linkId))
      toast.success('Share link deleted successfully!')
    } catch (error) {
      console.error('Error deleting share link:', error)
      toast.error('Failed to delete share link')
    }
  }

  const handleToggleActive = async (linkId: string, isActive: boolean) => {
    await handleUpdateLink(linkId, { is_active: !isActive })
  }

  const copyToClipboard = async (subdomain: string) => {
    const url = `https://${subdomain}.travelblogr.com`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Share Links</h2>
          <p className="text-sm text-gray-600 mt-1">
            Create custom links to share your trip with different audiences
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Link
        </Button>
      </div>

      {/* Share Links List */}
      {shareLinks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ExternalLink className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No share links yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first share link to start sharing your trip
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Share Link
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {shareLinks.map((link) => (
            <div
              key={link.id}
              className={`border rounded-lg p-4 ${
                link.is_active ? 'bg-white' : 'bg-gray-50 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-gray-900">{link.title}</h3>
                    {!link.is_active && (
                      <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {link.subdomain}.travelblogr.com
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(link.subdomain)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>

                  {link.description && (
                    <p className="text-sm text-gray-600 mb-2">{link.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {link.view_count} views
                    </div>
                    <div>
                      Created {new Date(link.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(`https://${link.subdomain}.travelblogr.com`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingLink(link)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(link.id, link.is_active)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteLink(link.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateShareLinkModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateLink}
        />
      )}

      {editingLink && (
        <EditShareLinkModal
          shareLink={editingLink}
          onClose={() => setEditingLink(null)}
          onSubmit={(updates) => handleUpdateLink(editingLink.id, updates)}
        />
      )}
    </div>
  )
}
