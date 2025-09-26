import { createServerSupabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/dashboard/DashboardNav'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerSupabase()
  
  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/signin')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} profile={profile} />
      
      <div className="flex">
        <DashboardNav />
        
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
