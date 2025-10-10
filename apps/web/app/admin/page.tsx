import { Metadata } from 'next'
import { createServerSupabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { Shield } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

export const metadata: Metadata = {
  title: 'Admin Dashboard | TravelBlogr',
  description: 'Administrative dashboard for managing users, content, and platform analytics.',
}

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic'

// Temporary minimal admin page to unblock production build.
// Full admin UI will be restored after dependencies are added.
export default async function AdminPage() {
  const supabase = createServerSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/auth/signin')

  const isAdmin = user.email?.includes('admin') || user.email === 'admin@travelblogr.com'
  if (!isAdmin) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-red-600" />
            <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
            <Badge variant="destructive" className="ml-2">Admin Access</Badge>
          </div>
          <p className="text-gray-600">Admin UI temporarily simplified to complete deployment.</p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-16">
        <div className="bg-white rounded-lg border p-8 text-center">
          <p className="text-gray-700">Analytics and user management panels will be restored after UI deps are added.</p>
        </div>
      </div>
    </div>
  )
}
