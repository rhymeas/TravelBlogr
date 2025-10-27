import { Metadata } from 'next'
import { createServerSupabase } from '@/lib/supabase-server'
import Link from 'next/link'
import {
  Activity,
  Globe,
  Wand2,
  Image as ImageIcon,
  Users,
  BarChart3,
  DollarSign,
  TrendingUp,
  Database,
  Zap,
  TestTube2,
  FileText,
  Settings,
  Trash2,
  MessageSquare
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Admin Dashboard | TravelBlogr',
  description: 'Administrative dashboard for managing users, content, and platform analytics.',
}

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  trend?: string
  href: string
}

function StatCard({ title, value, icon: Icon, trend, href }: StatCardProps) {
  return (
    <Link
      href={href}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-red-50 rounded-lg">
          <Icon className="h-6 w-6 text-red-600" />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-sm text-green-600">
            <TrendingUp className="h-4 w-4" />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-600">{title}</p>
    </Link>
  )
}

interface QuickActionProps {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  color: string
}

function QuickAction({ title, description, icon: Icon, href, color }: QuickActionProps) {
  return (
    <Link
      href={href}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow group"
    >
      <div className={`p-3 ${color} rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </Link>
  )
}

export default async function AdminPage() {
  const supabase = await createServerSupabase()

  // Fetch quick stats
  const [locationsCount, usersCount, tripsCount] = await Promise.all([
    supabase.from('locations').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('trips').select('id', { count: 'exact', head: true }),
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Admin Dashboard</h1>
        <p className="text-gray-600">Manage your TravelBlogr platform with zero-cost tools</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Locations"
          value={locationsCount.count || 0}
          icon={Database}
          trend="+12%"
          href="/admin/auto-fill"
        />
        <StatCard
          title="Total Users"
          value={usersCount.count || 0}
          icon={Users}
          trend="+8%"
          href="/admin/users"
        />
        <StatCard
          title="Active Trips"
          value={tripsCount.count || 0}
          icon={Globe}
          trend="+15%"
          href="/admin/analytics"
        />
        <StatCard
          title="AI Requests"
          value="0"
          icon={Zap}
          href="/admin/ai-monitoring"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <QuickAction
            title="Feature Flags"
            description="Toggle experimental features and Trip Planner V2"
            icon={Settings}
            href="/admin/feature-flags"
            color="bg-red-600"
          />
          <QuickAction
            title="AI Monitoring"
            description="Track AI requests, latency, and costs in real-time"
            icon={Activity}
            href="/admin/ai-monitoring"
            color="bg-blue-600"
          />
          <QuickAction
            title="Content Crawler"
            description="Crawl and import restaurant and activity data"
            icon={Globe}
            href="/admin/crawler"
            color="bg-green-600"
          />
          <QuickAction
            title="Auto-Fill Locations"
            description="Automatically populate location data from free APIs"
            icon={Wand2}
            href="/admin/auto-fill"
            color="bg-purple-600"
          />
          <QuickAction
            title="Image Management"
            description="Manage and optimize location images"
            icon={ImageIcon}
            href="/admin/images"
            color="bg-orange-600"
          />
          <QuickAction
            title="Location Cleanup"
            description="Clean up location names and remove duplicates"
            icon={Trash2}
            href="/admin/location-cleanup"
            color="bg-red-600"
          />
          <QuickAction
            title="User Management"
            description="Manage users, roles, and permissions"
            icon={Users}
            href="/admin/users"
            color="bg-indigo-600"
          />
          <QuickAction
            title="Analytics"
            description="View platform analytics and insights"
            icon={BarChart3}
            href="/admin/analytics"
            color="bg-pink-600"
          />
          <QuickAction
            title="Cost Tracking"
            description="Monitor service costs and free tier usage"
            icon={DollarSign}
            href="/admin/costs"
            color="bg-yellow-600"
          />
          <QuickAction
            title="Reddit Images Test"
            description="Test Reddit ULTRA image fetching for locations and trips"
            icon={TestTube2}
            href="/test/reddit-images"
            color="bg-cyan-600"
          />
          <QuickAction
            title="Blog CMS"
            description="Edit and manage blog posts with rich text editor"
            icon={FileText}
            href="/blog-cms"
            color="bg-teal-600"
          />
          <QuickAction
            title="User Feedback"
            description="View and respond to user feedback messages"
            icon={MessageSquare}
            href="/admin/feedback"
            color="bg-blue-600"
          />
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Status</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Groq API</span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              ✓ Connected
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Supabase Database</span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              ✓ Connected
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Helicone Monitoring</span>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              ⚠ Setup Required
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
