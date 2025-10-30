import type { Metadata } from 'next'
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
  MessageSquare,
  ArrowUpRight,
  Sparkles
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
  trendUp?: boolean
  href: string
  color: string
}

function StatCard({ title, value, icon: Icon, trend, trendUp = true, href, color }: StatCardProps) {
  return (
    <Link
      href={href}
      className="apple-card p-6 group apple-hover-scale"
    >
      <div className="flex items-start justify-between mb-6">
        <div className={`p-3 ${color} rounded-2xl shadow-sm group-hover:shadow-md apple-transition`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
            trendUp ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            <TrendingUp className={`h-3.5 w-3.5 ${!trendUp && 'rotate-180'}`} />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="text-4xl font-bold apple-text-primary tracking-tight">{value}</h3>
        <p className="text-sm apple-text-secondary font-medium">{title}</p>
      </div>
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
      className="apple-card p-6 group apple-hover-scale"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 ${color} rounded-2xl shadow-sm group-hover:shadow-md apple-transition`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <ArrowUpRight className="h-5 w-5 apple-text-tertiary group-hover:apple-text-primary apple-transition" />
      </div>
      <h3 className="text-base font-semibold apple-text-primary mb-2 group-hover:text-blue-600 apple-transition">
        {title}
      </h3>
      <p className="text-sm apple-text-secondary leading-relaxed">{description}</p>
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
    <div className="min-h-screen apple-bg-primary">
      <div className="max-w-[1400px] mx-auto px-8 py-10">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-5xl font-bold apple-text-primary tracking-tight">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-lg apple-text-secondary font-medium ml-14">
            Manage your TravelBlogr platform with powerful tools
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            title="Total Locations"
            value={locationsCount.count || 0}
            icon={Database}
            trend="+12%"
            href="/admin/auto-fill"
            color="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <StatCard
            title="Total Users"
            value={usersCount.count || 0}
            icon={Users}
            trend="+8%"
            href="/admin/users"
            color="bg-gradient-to-br from-purple-500 to-purple-600"
          />
          <StatCard
            title="Active Trips"
            value={tripsCount.count || 0}
            icon={Globe}
            trend="+15%"
            href="/admin/analytics"
            color="bg-gradient-to-br from-green-500 to-green-600"
          />
          <StatCard
            title="AI Requests"
            value="0"
            icon={Zap}
            trend="—"
            trendUp={false}
            href="/admin/ai-monitoring"
            color="bg-gradient-to-br from-orange-500 to-orange-600"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold apple-text-primary mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <QuickAction
              title="Feature Flags"
              description="Toggle experimental features and Trip Planner V2"
              icon={Settings}
              href="/admin/feature-flags"
              color="bg-gradient-to-br from-red-500 to-red-600"
            />
            <QuickAction
              title="AI Monitoring"
              description="Track AI requests, latency, and costs in real-time"
              icon={Activity}
              href="/admin/ai-monitoring"
              color="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <QuickAction
              title="Content Crawler"
              description="Crawl and import restaurant and activity data"
              icon={Globe}
              href="/admin/crawler"
              color="bg-gradient-to-br from-green-500 to-green-600"
            />
            <QuickAction
              title="Auto-Fill Locations"
              description="Automatically populate location data from free APIs"
              icon={Wand2}
              href="/admin/auto-fill"
              color="bg-gradient-to-br from-purple-500 to-purple-600"
            />
            <QuickAction
              title="Image Management"
              description="Manage and optimize location images"
              icon={ImageIcon}
              href="/admin/images"
              color="bg-gradient-to-br from-orange-500 to-orange-600"
            />
            <QuickAction
              title="Location Cleanup"
              description="Clean up location names and remove duplicates"
              icon={Trash2}
              href="/admin/location-cleanup"
              color="bg-gradient-to-br from-red-500 to-pink-600"
            />
            <QuickAction
              title="User Management"
              description="Manage users, roles, and permissions"
              icon={Users}
              href="/admin/users"
              color="bg-gradient-to-br from-indigo-500 to-indigo-600"
            />
            <QuickAction
              title="Analytics"
              description="View platform analytics and insights"
              icon={BarChart3}
              href="/admin/analytics"
              color="bg-gradient-to-br from-pink-500 to-pink-600"
            />
            <QuickAction
              title="Cost Tracking"
              description="Monitor service costs and free tier usage"
              icon={DollarSign}
              href="/admin/costs"
              color="bg-gradient-to-br from-yellow-500 to-yellow-600"
            />
            <QuickAction
              title="User Feedback"
              description="View and respond to user feedback messages"
              icon={MessageSquare}
              href="/admin/feedback"
              color="bg-gradient-to-br from-blue-500 to-cyan-600"
            />
            <QuickAction
              title="Blog CMS"
              description="Edit and manage blog posts with rich text editor"
              icon={FileText}
              href="/blog-cms"
              color="bg-gradient-to-br from-teal-500 to-teal-600"
            />
            <QuickAction
              title="Reddit Images Test"
              description="Test Reddit ULTRA image fetching for locations"
              icon={TestTube2}
              href="/test/reddit-images"
              color="bg-gradient-to-br from-cyan-500 to-cyan-600"
            />
          </div>
        </div>

        {/* System Status */}
        <div className="apple-card p-8">
          <h2 className="text-2xl font-bold apple-text-primary mb-6">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl border border-green-100">
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
              <div className="flex-1">
                <p className="font-semibold apple-text-primary text-sm">Groq API</p>
                <p className="text-xs apple-text-secondary">Connected & Operational</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl border border-green-100">
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
              <div className="flex-1">
                <p className="font-semibold apple-text-primary text-sm">Supabase Database</p>
                <p className="text-xs apple-text-secondary">Connected & Operational</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
              <div className="h-3 w-3 bg-yellow-500 rounded-full shadow-lg shadow-yellow-500/50" />
              <div className="flex-1">
                <p className="font-semibold apple-text-primary text-sm">Helicone Monitoring</p>
                <p className="text-xs apple-text-secondary">Setup Required</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}