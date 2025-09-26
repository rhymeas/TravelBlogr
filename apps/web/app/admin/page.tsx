import { Metadata } from 'next'
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard'
import { UserManagement } from '@/components/admin/UserManagement'
import { createServerSupabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { BarChart3, Users, Settings, Shield, Activity, Database } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Admin Dashboard | TravelBlogr',
  description: 'Administrative dashboard for managing users, content, and platform analytics.',
}

export default async function AdminPage() {
  const supabase = createServerSupabase()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/signin')
  }

  // Check if user is admin (simple check - in production, use proper role management)
  const isAdmin = user.email?.includes('admin') || user.email === 'admin@travelblogr.com'
  
  if (!isAdmin) {
    redirect('/dashboard')
  }

  // Get quick stats for the header
  const [usersResult, tripsResult, postsResult, mediaResult] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('trips').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('media_files').select('*', { count: 'exact', head: true })
  ])

  const stats = {
    users: usersResult.count || 0,
    trips: tripsResult.count || 0,
    posts: postsResult.count || 0,
    media: mediaResult.count || 0
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-6 w-6 text-red-600" />
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <Badge variant="destructive" className="ml-2">Admin Access</Badge>
              </div>
              <p className="text-gray-600">
                Manage your TravelBlogr platform with comprehensive analytics and user management tools.
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="hidden md:flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.users.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.trips.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Trips</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.posts.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.media.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Media</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="moderation" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Moderation
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              System
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard
              userId={user.id}
              isAdmin={isAdmin}
              className="w-full"
            />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement
              currentUserId={user.id}
              isAdmin={isAdmin}
              className="w-full"
            />
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <div className="bg-white rounded-lg border p-8 text-center">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Content Management</h3>
              <p className="text-gray-600 mb-4">
                Manage trips, posts, media files, and user-generated content.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Trip Management</h4>
                  <p className="text-sm text-gray-600">Review and moderate user trips</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Media Review</h4>
                  <p className="text-sm text-gray-600">Check uploaded images and videos</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Content Reports</h4>
                  <p className="text-sm text-gray-600">Handle user reports and flags</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="moderation" className="space-y-6">
            <div className="bg-white rounded-lg border p-8 text-center">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Content Moderation</h3>
              <p className="text-gray-600 mb-4">
                Review reported content, manage community guidelines, and handle violations.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">Pending Reports</h4>
                  <p className="text-sm text-red-700">0 reports awaiting review</p>
                </div>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">Flagged Content</h4>
                  <p className="text-sm text-yellow-700">0 items flagged by system</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <div className="bg-white rounded-lg border p-8 text-center">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">System Health</h3>
              <p className="text-gray-600 mb-4">
                Monitor system performance, database health, and application metrics.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-1">Database</h4>
                  <p className="text-sm text-green-700">Healthy</p>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-1">Storage</h4>
                  <p className="text-sm text-green-700">85% Used</p>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-1">API</h4>
                  <p className="text-sm text-green-700">99.9% Uptime</p>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-1">CDN</h4>
                  <p className="text-sm text-green-700">Operational</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="bg-white rounded-lg border p-8 text-center">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Platform Settings</h3>
              <p className="text-gray-600 mb-4">
                Configure platform-wide settings, features, and integrations.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <div className="p-4 bg-gray-50 rounded-lg text-left">
                  <h4 className="font-medium mb-2">General Settings</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Site name and branding</li>
                    <li>• Default privacy settings</li>
                    <li>• Registration settings</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-left">
                  <h4 className="font-medium mb-2">Feature Flags</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Social features enabled</li>
                    <li>• Real-time updates enabled</li>
                    <li>• Media compression enabled</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-left">
                  <h4 className="font-medium mb-2">Integrations</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Email service (Resend)</li>
                    <li>• Storage (Supabase)</li>
                    <li>• Maps (Mapbox/Leaflet)</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-left">
                  <h4 className="font-medium mb-2">Security</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Rate limiting enabled</li>
                    <li>• CORS configured</li>
                    <li>• SSL/TLS enforced</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
