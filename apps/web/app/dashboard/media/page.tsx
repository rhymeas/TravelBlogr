import { Metadata } from 'next'
import { MediaManager } from '@/components/media/MediaManager'
import { createServerSupabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Media Library | TravelBlogr',
  description: 'Manage your travel photos, videos, and documents with advanced compression and organization features.',
}

export default async function MediaPage() {
  const supabase = createServerSupabase()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <MediaManager
        userId={user.id}
        allowUpload={true}
        allowDelete={true}
        viewMode="grid"
        className="max-w-7xl mx-auto"
      />
    </div>
  )
}
