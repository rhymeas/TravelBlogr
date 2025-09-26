'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog'
import { 
  Plus, Search, Filter, Edit, Trash2, Eye, Calendar, 
  FileText, Tag, Folder, Image, BarChart3, Settings,
  Globe, Lock, Users, Clock, TrendingUp
} from 'lucide-react'
// import { NovelEditor } from './NovelEditor' // temporarily disabled for deployment
import { createClientSupabase } from '@/lib/supabase'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface CMSPost {
  id: string
  title: string
  slug: string
  content: any
  excerpt?: string
  status: 'draft' | 'published' | 'scheduled'
  visibility: 'public' | 'private' | 'password'
  featured_image?: string
  tags: string[]
  category?: string
  author_id: string
  published_at?: string
  view_count: number
  like_count: number
  comment_count: number
  created_at: string
  updated_at: string
}

interface CMSDashboardProps {
  userId: string
  isAdmin?: boolean
  className?: string
}

export function CMSDashboard({
  userId,
  isAdmin = false,
  className = ''
}: CMSDashboardProps) {
  const [posts, setPosts] = useState<CMSPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showEditor, setShowEditor] = useState(false)
  const [editingPost, setEditingPost] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    drafts: 0,
    scheduled: 0,
    totalViews: 0,
    totalLikes: 0
  })

  const supabase = createClientSupabase()

  useEffect(() => {
    loadPosts()
    loadStats()
  }, [statusFilter, categoryFilter])

  const loadPosts = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('cms_posts')
        .select('*')
        .order('updated_at', { ascending: false })

      // Apply filters
      if (!isAdmin) {
        query = query.eq('author_id', userId)
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter)
      }

      const { data, error } = await query

      if (error) throw error

      setPosts(data || [])
    } catch (error) {
      console.error('Error loading posts:', error)
      toast.error('Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      let query = supabase
        .from('cms_posts')
        .select('status, view_count, like_count')

      if (!isAdmin) {
        query = query.eq('author_id', userId)
      }

      const { data, error } = await query

      if (error) throw error

      const stats = data?.reduce((acc, post) => ({
        total: acc.total + 1,
        published: acc.published + (post.status === 'published' ? 1 : 0),
        drafts: acc.drafts + (post.status === 'draft' ? 1 : 0),
        scheduled: acc.scheduled + (post.status === 'scheduled' ? 1 : 0),
        totalViews: acc.totalViews + (post.view_count || 0),
        totalLikes: acc.totalLikes + (post.like_count || 0)
      }), {
        total: 0,
        published: 0,
        drafts: 0,
        scheduled: 0,
        totalViews: 0,
        totalLikes: 0
      }) || {
        total: 0,
        published: 0,
        drafts: 0,
        scheduled: 0,
        totalViews: 0,
        totalLikes: 0
      }

      setStats(stats)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const deletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const { error } = await supabase
        .from('cms_posts')
        .delete()
        .eq('id', postId)

      if (error) throw error

      setPosts(prev => prev.filter(post => post.id !== postId))
      toast.success('Post deleted successfully')
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error('Failed to delete post')
    }
  }

  const duplicatePost = async (post: CMSPost) => {
    try {
      const { data, error } = await supabase
        .from('cms_posts')
        .insert({
          title: `${post.title} (Copy)`,
          slug: `${post.slug}-copy-${Date.now()}`,
          content: post.content,
          excerpt: post.excerpt,
          status: 'draft',
          visibility: post.visibility,
          tags: post.tags,
          category: post.category,
          author_id: userId
        })
        .select()
        .single()

      if (error) throw error

      setPosts(prev => [data, ...prev])
      toast.success('Post duplicated successfully')
    } catch (error) {
      console.error('Error duplicating post:', error)
      toast.error('Failed to duplicate post')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <Globe className="h-4 w-4" />
      case 'draft':
        return <FileText className="h-4 w-4" />
      case 'scheduled':
        return <Clock className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Globe className="h-3 w-3" />
      case 'private':
        return <Lock className="h-3 w-3" />
      case 'password':
        return <Users className="h-3 w-3" />
      default:
        return <Globe className="h-3 w-3" />
    }
  }

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Editor temporarily disabled to unblock deployment.
  // if (showEditor) {
  //   return null
  // }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
          <p className="text-gray-600">Create and manage your blog posts and content</p>
        </div>
        
        <Button
          onClick={() => setShowEditor(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Post
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Posts</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Published</p>
              <p className="text-xl font-bold">{stats.published}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Drafts</p>
              <p className="text-xl font-bold">{stats.drafts}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Scheduled</p>
              <p className="text-xl font-bold">{stats.scheduled}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-xl font-bold">{stats.totalViews.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Total Likes</p>
              <p className="text-xl font-bold">{stats.totalLikes.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts..."
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Travel Guide">Travel Guide</SelectItem>
              <SelectItem value="Food & Dining">Food & Dining</SelectItem>
              <SelectItem value="Adventure">Adventure</SelectItem>
              <SelectItem value="Culture">Culture</SelectItem>
              <SelectItem value="Photography">Photography</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Posts List */}
      <Card>
        {loading ? (
          <div className="p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gray-300 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first blog post to get started'
              }
            </p>
            {!searchQuery && statusFilter === 'all' && categoryFilter === 'all' && (
              <Button onClick={() => setShowEditor(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Post
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {filteredPosts.map((post) => (
              <div key={post.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`flex items-center gap-1 ${getStatusColor(post.status)}`}>
                        {getStatusIcon(post.status)}
                        {post.status}
                      </Badge>
                      
                      <div className="flex items-center gap-1 text-gray-500">
                        {getVisibilityIcon(post.visibility)}
                        <span className="text-xs">{post.visibility}</span>
                      </div>

                      {post.category && (
                        <Badge variant="outline" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {post.category}
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                      {post.title}
                    </h3>
                    
                    {post.excerpt && (
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Updated {format(new Date(post.updated_at), 'MMM d, yyyy')}</span>
                      <span>{post.view_count} views</span>
                      <span>{post.like_count} likes</span>
                      <span>{post.comment_count} comments</span>
                    </div>

                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {post.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {post.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{post.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingPost(post.id)
                        setShowEditor(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => duplicatePost(post)}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePost(post.id)}
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
      </Card>
    </div>
  )
}
