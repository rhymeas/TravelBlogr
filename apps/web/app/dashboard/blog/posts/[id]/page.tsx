'use client'

/**
 * Blog Post Editor Page
 * 
 * Smart travel blog post editor with:
 * - Inline editing for all fields
 * - Auto-save functionality
 * - Location-based POI suggestions
 * - AI content assistance
 * - Rich text editing
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BlogPostEditor } from '@/components/blog/BlogPostEditor'
import { useBlogPost } from '@/hooks/useBlogData'
import { getBrowserSupabase } from '@/lib/supabase'
import { ArrowLeft, Eye, Save, Loader2 } from 'lucide-react'

export default function BlogPostEditPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { post, isLoading, mutate } = useBlogPost(params.id)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Auto-save functionality
  useEffect(() => {
    if (!hasUnsavedChanges) return

    const timer = setTimeout(() => {
      handleAutoSave()
    }, 30000) // Auto-save every 30 seconds

    return () => clearTimeout(timer)
  }, [hasUnsavedChanges, post])

  const handleAutoSave = async () => {
    if (!post || !hasUnsavedChanges) return
    
    setIsSaving(true)
    const supabase = getBrowserSupabase()
    
    const { error } = await supabase
      .from('blog_posts')
      .update({
        ...post,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (!error) {
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
      mutate()
    }
    
    setIsSaving(false)
  }

  const handleSave = async () => {
    await handleAutoSave()
  }

  const handlePublish = async () => {
    if (!post) return

    setIsSaving(true)
    const supabase = getBrowserSupabase()
    
    const { error } = await supabase
      .from('blog_posts')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (!error) {
      mutate()
      router.push(`/blog/posts/${post.slug}`)
    }
    
    setIsSaving(false)
  }

  const handlePreview = () => {
    if (post?.slug) {
      window.open(`/blog/posts/${post.slug}?preview=true`, '_blank')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rausch-600" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <button
            onClick={() => router.push('/dashboard/blog')}
            className="text-rausch-600 hover:underline"
          >
            ← Back to Blog Posts
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard/blog')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {post.title || 'Untitled Post'}
                </h1>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    post.status === 'published'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {post.status}
                  </span>
                  {lastSaved && (
                    <span>Saved {lastSaved.toLocaleTimeString()}</span>
                  )}
                  {isSaving && (
                    <span className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving...
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePreview}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                Save Draft
              </button>
              <button
                onClick={handlePublish}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-rausch-600 text-white rounded-lg hover:bg-rausch-700 transition-colors disabled:opacity-50"
              >
                {post.status === 'published' ? 'Update' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <BlogPostEditor
          post={post}
          onChange={(updatedPost) => {
            setHasUnsavedChanges(true)
            mutate({ ...post, ...updatedPost }, false)
          }}
          onSave={handleSave}
        />
      </div>
    </div>
  )
}

