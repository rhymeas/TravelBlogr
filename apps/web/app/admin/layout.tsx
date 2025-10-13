import { Metadata } from 'next'
import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { AdminNav } from '@/components/admin/AdminNav'

export const metadata: Metadata = {
  title: 'Admin Dashboard | TravelBlogr',
  description: 'Administrative dashboard for managing TravelBlogr platform',
}

// Force dynamic rendering for all admin pages
export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check authentication
  const supabase = await createServerSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/signin?redirect=/admin')
  }

  // Check admin permissions
  const isAdmin = user.email?.includes('admin') || user.email === 'admin@travelblogr.com'
  
  if (!isAdmin) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <main>{children}</main>
    </div>
  )
}

