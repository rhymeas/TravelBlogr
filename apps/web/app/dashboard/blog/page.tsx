'use client'

/**
 * Dashboard Blog Posts List
 * 
 * Shows all user's blog posts with:
 * - Create new post button
 * - Filter by status (draft, published)
 * - Search posts
 * - Quick actions (edit, delete, duplicate)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, MoreVertical, Edit, Trash2, Copy, Eye } from 'lucide-react'
import { useBlogPosts } from '@/hooks/useBlogData'
import { getBrowserSupabase } from '@/lib/supabase'

export default function DashboardBlogPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all')
  
  const { posts, isLoading, mutate } = useBlogPosts({
    status: statusFilter === 'all' ? undefined : statusFilter
  })

  const handleCreatePost = async () => {
    const supabase = getBrowserSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/signin')
      return
    }

    // Create new draft post
    const { data: newPost, error } = await supabase
      .from('blog_posts')
      .insert({
        title: 'Untitled Post',
        excerpt: '',
        content: {
          destination: '',
          introduction: '',
          highlights: [],
          days: [],
          practicalInfo: {}
        },
        status: 'draft',
        author_id: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating post:', error)
      return
    }

    // Navigate to edit page
    router.push(`/dashboard/blog/posts/${newPost.id}`)
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    const supabase = getBrowserSupabase()
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', postId)

    if (error) {
      console.error('Error deleting post:', error)
      return
    }

    mutate()
  }

  const filteredPosts = posts.filter((post: any) =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Blog Posts</h1>
            <p className="text-gray-600 mt-1">Create and manage your travel blog posts</p>
          </div>
          <button
            onClick={handleCreatePost}
            className="flex items-center gap-2 px-4 py-2 bg-rausch-600 text-white rounded-lg hover:bg-rausch-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            New Post
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rausch-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rausch-500 focus:border-transparent"
              >
                <option value="all">All Posts</option>
                <option value="draft">Drafts</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
        </div>

        {/* Posts List */}
        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-rausch-500"></div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-600 mb-4">No blog posts yet</p>
            <button
              onClick={handleCreatePost}
              className="text-rausch-600 hover:underline"
            >
              Create your first post
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPosts.map((post: any) => (
              <div
                key={post.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {post.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        post.status === 'published'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {post.status}
                      </span>
                    </div>
                    {post.excerpt && (
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      {post.view_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {post.view_count} views
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/dashboard/blog/posts/${post.id}`)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    {post.status === 'published' && (
                      <button
                        onClick={() => router.push(`/blog/posts/${post.slug}`)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

