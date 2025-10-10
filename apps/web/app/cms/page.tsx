import { Metadata } from 'next'
import { CMSDashboard } from '@/components/cms/CMSDashboard'
import { createServerSupabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'

// Force dynamic rendering - requires authentication, should not be static
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Content Management | TravelBlogr',
  description: 'Create and manage your blog posts and content with our modern CMS.',
}

export default async function CMSPage() {
  const supabase = createServerSupabase()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/signin')
  }

  // Check if user has CMS access (could be based on role or subscription)
  const { data: profile } = await supabase
    .from('users')
    .select('role, subscription_tier')
    .eq('id', user.id)
    .single()

  const hasAccess = profile?.role === 'admin' || 
                   profile?.subscription_tier === 'premium' ||
                   profile?.subscription_tier === 'pro'

  if (!hasAccess) {
    redirect('/dashboard?upgrade=cms')
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* CMS Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CMS</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Content Management System</h1>
              </div>
              <p className="text-gray-600">
                Create, edit, and publish beautiful blog posts with our modern editor.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                ✨ Novel Editor
              </div>
              {isAdmin && (
                <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                  Admin Access
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CMS Content */}
      <div className="container mx-auto px-4 py-8">
        <CMSDashboard
          userId={user.id}
          isAdmin={isAdmin}
          className="max-w-7xl mx-auto"
        />
      </div>
    </div>
  )
}
