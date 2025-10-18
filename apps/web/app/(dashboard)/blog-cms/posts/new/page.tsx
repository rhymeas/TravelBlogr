'use client'

/**
 * New Blog Post Editor Page
 * 
 * Create a new blog post using the Novel editor.
 */

import { useRouter } from 'next/navigation'
import { NovelEditor } from '@/components/cms/NovelEditor'
import { useAuth } from '@/hooks/useAuth'

export default function NewBlogPostPage() {
  const router = useRouter()
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Please sign in to create a blog post.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Create New Post</h1>
          <p className="text-gray-600 mt-1">Write and publish your travel story</p>
        </div>

        <NovelEditor
          userId={user.id}
          onSave={(post) => {
            router.push(`/blog-cms/posts/${post.id}/edit`)
          }}
        />
      </div>
    </div>
  )
}

