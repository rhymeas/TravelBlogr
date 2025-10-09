'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { 
  MapPin, 
  Calendar, 
  Image as ImageIcon, 
  Edit, 
  Trash2, 
  Eye,
  Plus,
  MoreVertical
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import toast from 'react-hot-toast'

interface Post {
  id: string
  title: string
  content?: string
  post_date?: string
  location?: {
    lat: number
    lng: number
    name?: string
  }
  photos?: string[]
  created_at: string
  updated_at: string
}

interface PostsListProps {
  tripId: string
  posts: Post[]
}

export function PostsList({ tripId, posts }: PostsListProps) {
  const [showMenu, setShowMenu] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return
    }

    setIsDeleting(postId)
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete post')
      }

      toast.success('Post deleted successfully')
      window.location.reload() // Refresh to update the list
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error('Failed to delete post')
    } finally {
      setIsDeleting(null)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <ImageIcon className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
        <p className="text-gray-500 mb-6">
          Start documenting your journey by creating your first post
        </p>
        <Link href={`/dashboard/trips/${tripId}/posts/new`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create First Post
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Posts ({posts.length})
        </h2>
        <Link href={`/dashboard/trips/${tripId}/posts/new`}>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </Link>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Card key={post.id} className="group hover:shadow-lg transition-shadow overflow-hidden">
            {/* Post Image */}
            <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200">
              {post.photos && post.photos.length > 0 ? (
                <img
                  src={post.photos[0]}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}
              
              {/* Photo Count Badge */}
              {post.photos && post.photos.length > 1 && (
                <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-md text-xs flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  {post.photos.length}
                </div>
              )}

              {/* Actions Menu */}
              <div className="absolute top-3 left-3">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMenu(showMenu === post.id ? null : post.id)}
                    className="bg-white/90 hover:bg-white"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>

                  {showMenu === post.id && (
                    <>
                      <div className="absolute left-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        <Link
                          href={`/dashboard/trips/${tripId}/posts/${post.id}/edit`}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowMenu(null)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                        <Link
                          href={`/dashboard/trips/${tripId}/posts/${post.id}`}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowMenu(null)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Link>
                        <button
                          onClick={() => {
                            setShowMenu(null)
                            handleDelete(post.id)
                          }}
                          disabled={isDeleting === post.id}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {isDeleting === post.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>

                      {/* Click outside to close */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowMenu(null)}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="p-4">
              <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                <Link 
                  href={`/dashboard/trips/${tripId}/posts/${post.id}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {post.title}
                </Link>
              </h3>

              {post.content && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {post.content}
                </p>
              )}

              {/* Meta Information */}
              <div className="flex flex-col gap-2 text-xs text-gray-500">
                {post.post_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(post.post_date)}</span>
                  </div>
                )}

                {post.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">
                      {post.location.name || `${post.location.lat.toFixed(4)}, ${post.location.lng.toFixed(4)}`}
                    </span>
                  </div>
                )}

                <div className="text-gray-400 pt-1 border-t border-gray-100">
                  Updated {formatDistanceToNow(new Date(post.updated_at), { addSuffix: true })}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

