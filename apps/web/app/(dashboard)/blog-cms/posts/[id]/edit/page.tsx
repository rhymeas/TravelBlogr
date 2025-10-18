'use client'

/**
 * Edit Blog Post Page
 * 
 * Edit an existing blog post using the Novel editor.
 */

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { NovelEditor } from '@/components/cms/NovelEditor'
import { useAuth } from '@/hooks/useAuth'

export default function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Please sign in to edit this post.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Post</h1>
          <p className="text-gray-600 mt-1">Update your travel story</p>
        </div>

        <NovelEditor
          postId={id}
          userId={user.id}
          onSave={(post) => {
            // Stay on the same page after saving
          }}
        />
      </div>
    </div>
  )
}

