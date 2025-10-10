// @ts-nocheck - Novel Editor has complex type exports
'use client'

import { useState, useEffect } from 'react'
import { Editor } from 'novel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog'
import { Save, Eye, Settings, Tag, Calendar, User, Globe, Lock, Users } from 'lucide-react'
import { createClientSupabase } from '@/lib/supabase'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface CMSPost {
  id: string
  title: string
  slug: string
  content: any // JSON content from Novel editor
  excerpt?: string
  status: 'draft' | 'published' | 'scheduled'
  visibility: 'public' | 'private' | 'password'
  password?: string
  featured_image?: string
  tags: string[]
  category?: string
  author_id: string
  published_at?: string
  scheduled_at?: string
  seo_title?: string
  seo_description?: string
  created_at: string
  updated_at: string
}

interface NovelEditorProps {
  postId?: string
  userId: string
  onSave?: (post: CMSPost) => void
  className?: string
}

const POST_CATEGORIES = [
  'Travel Guide',
  'Food & Dining',
  'Adventure',
  'Culture',
  'Photography',
  'Tips & Tricks',
  'Accommodation',
  'Transportation',
  'Budget Travel',
  'Luxury Travel'
]

export function NovelEditor({
  postId,
  userId,
  onSave,
  className = ''
}: NovelEditorProps) {
  const [post, setPost] = useState<Partial<CMSPost>>({
    title: '',
    slug: '',
    content: null,
    status: 'draft',
    visibility: 'public',
    tags: [],
    author_id: userId
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [newTag, setNewTag] = useState('')

  const supabase = createClientSupabase()

  useEffect(() => {
    if (postId) {
      loadPost()
    }
  }, [postId])

  const loadPost = async () => {
    if (!postId) return

    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('cms_posts')
        .select('*')
        .eq('id', postId)
        .single()

      if (error) throw error

      setPost(data)
    } catch (error) {
      console.error('Error loading post:', error)
      toast.error('Failed to load post')
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleTitleChange = (title: string) => {
    setPost(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title)
    }))
  }

  const addTag = () => {
    if (!newTag.trim() || post.tags?.includes(newTag.trim())) return

    setPost(prev => ({
      ...prev,
      tags: [...(prev.tags || []), newTag.trim()]
    }))
    setNewTag('')
  }

  const removeTag = (tagToRemove: string) => {
    setPost(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }))
  }

  const savePost = async (status: 'draft' | 'published' = 'draft') => {
    if (!post.title?.trim()) {
      toast.error('Please enter a title')
      return
    }

    try {
      setSaving(true)

      const postData = {
        ...post,
        status,
        slug: post.slug || generateSlug(post.title),
        published_at: status === 'published' ? new Date().toISOString() : post.published_at,
        updated_at: new Date().toISOString()
      }

      let result
      if (postId) {
        const { data, error } = await supabase
          .from('cms_posts')
          .update(postData)
          .eq('id', postId)
          .select()
          .single()

        if (error) throw error
        result = data
      } else {
        const { data, error } = await supabase
          .from('cms_posts')
          .insert({
            ...postData,
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        if (error) throw error
        result = data
      }

      setPost(result)
      toast.success(`Post ${status === 'published' ? 'published' : 'saved'} successfully`)
      
      if (onSave) {
        onSave(result)
      }
    } catch (error) {
      console.error('Error saving post:', error)
      toast.error('Failed to save post')
    } finally {
      setSaving(false)
    }
  }

  const schedulePost = async () => {
    if (!post.scheduled_at) {
      toast.error('Please select a schedule date')
      return
    }

    await savePost('scheduled' as any)
  }

  if (loading) {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        <div className="h-8 bg-gray-300 rounded w-1/3"></div>
        <div className="h-64 bg-gray-300 rounded"></div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
              {post.status || 'draft'}
            </Badge>
            <Badge variant="outline">
              {post.visibility || 'public'}
            </Badge>
          </div>
          
          {post.updated_at && (
            <span className="text-sm text-gray-500">
              Last saved {format(new Date(post.updated_at), 'MMM d, yyyy HH:mm')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Post Settings</DialogTitle>
              </DialogHeader>
              <PostSettings post={post} setPost={setPost} />
            </DialogContent>
          </Dialog>

          <Button
            onClick={() => savePost('draft')}
            disabled={saving}
            variant="outline"
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>

          <Button
            onClick={() => savePost('published')}
            disabled={saving}
            size="sm"
          >
            {saving ? 'Publishing...' : 'Publish'}
          </Button>
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Input
          value={post.title || ''}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Enter your post title..."
          className="text-2xl font-bold border-none px-0 py-2 focus:ring-0 placeholder:text-gray-400"
        />
        
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Slug:</span>
          <Input
            value={post.slug || ''}
            onChange={(e) => setPost(prev => ({ ...prev, slug: e.target.value }))}
            placeholder="post-slug"
            className="text-sm border-none px-2 py-1 bg-gray-50 rounded"
          />
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          {post.tags?.map(tag => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer hover:bg-red-100"
              onClick={() => removeTag(tag)}
            >
              <Tag className="h-3 w-3 mr-1" />
              {tag}
              <span className="ml-1 text-xs">×</span>
            </Badge>
          ))}
          
          <div className="flex items-center gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
              placeholder="Add tag..."
              className="w-32 text-sm"
            />
            <Button onClick={addTag} size="sm" variant="outline">
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <Card className="min-h-[500px]">
        <Editor
          defaultValue={post.content}
          onUpdate={(editor: any) => {
            setPost(prev => ({
              ...prev,
              content: editor?.getJSON()
            }))
          }}
          className="min-h-[500px] p-6"
          editorProps={{
            attributes: {
              class: 'prose prose-lg max-w-none focus:outline-none'
            }
          }}
        />
      </Card>
    </div>
  )
}

// Post Settings Component
function PostSettings({ 
  post, 
  setPost 
}: { 
  post: Partial<CMSPost>
  setPost: (post: Partial<CMSPost>) => void 
}) {
  return (
    <div className="space-y-6">
      {/* Visibility */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Visibility</label>
        <Select
          value={post.visibility}
          onValueChange={(value: any) => setPost({ ...post, visibility: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Public
              </div>
            </SelectItem>
            <SelectItem value="private">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Private
              </div>
            </SelectItem>
            <SelectItem value="password">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Password Protected
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        
        {post.visibility === 'password' && (
          <Input
            value={post.password || ''}
            onChange={(e) => setPost({ ...post, password: e.target.value })}
            placeholder="Enter password"
            type="password"
          />
        )}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Category</label>
        <Select
          value={post.category}
          onValueChange={(value: string) => setPost({ ...post, category: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {POST_CATEGORIES.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Schedule */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Schedule Publication</label>
        <Input
          type="datetime-local"
          value={post.scheduled_at ? format(new Date(post.scheduled_at), "yyyy-MM-dd'T'HH:mm") : ''}
          onChange={(e) => setPost({ ...post, scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
        />
      </div>

      {/* SEO */}
      <div className="space-y-4">
        <h3 className="font-medium">SEO Settings</h3>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">SEO Title</label>
          <Input
            value={post.seo_title || ''}
            onChange={(e) => setPost({ ...post, seo_title: e.target.value })}
            placeholder="SEO optimized title"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">SEO Description</label>
          <textarea
            value={post.seo_description || ''}
            onChange={(e) => setPost({ ...post, seo_description: e.target.value })}
            placeholder="SEO meta description"
            className="w-full p-2 border rounded-md resize-none"
            rows={3}
          />
        </div>
      </div>
    </div>
  )
}
