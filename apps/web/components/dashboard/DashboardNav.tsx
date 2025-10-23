'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { isAdmin } from '@/lib/utils/adminCheck'
import {
  MapPin,
  Plus,
  BarChart3,
  Settings,
  Share2,
  Camera,
  Users,
  Globe,
  FileText,
  DollarSign,
  Shield,
  Heart,
  Check,
  StickyNote
} from 'lucide-react'

const navigation = [
  {
    name: 'Overview',
    href: '/dashboard',
    icon: BarChart3,
  },
  {
    name: 'My Trips',
    href: '/dashboard/trips',
    icon: MapPin,
  },
  {
    name: 'Create Trip',
    href: '/dashboard/trips/new',
    icon: Plus,
  },
  {
    name: 'My Wishlist',
    href: '/dashboard/my-wishlist',
    icon: Heart,
  },
  {
    name: 'My Visited',
    href: '/dashboard/my-visited',
    icon: Check,
  },
  {
    name: 'My Notes',
    href: '/dashboard/my-notes',
    icon: StickyNote,
  },
  {
    name: 'Blog Posts',
    href: '/dashboard/blog',
    icon: FileText,
  },
  {
    name: 'Earnings',
    href: '/earnings',
    icon: DollarSign,
  },
  {
    name: 'Share Links',
    href: '/dashboard/shares',
    icon: Share2,
  },
  {
    name: 'Media Library',
    href: '/dashboard/media',
    icon: Camera,
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function DashboardNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  // Check if user is admin
  const userIsAdmin = isAdmin(user?.email)

  return (
    <nav className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2 mb-8">
          <MapPin className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">TravelBlogr</span>
        </Link>

        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="space-y-1">
            <Link
              href="/dashboard/trips/new"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              <Plus className="h-4 w-4" />
              New Trip
            </Link>
            <Link
              href="/dashboard/shares"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              <Globe className="h-4 w-4" />
              Share Links
            </Link>
          </div>
        </div>

        {/* Admin Section - Only visible to admins */}
        {userIsAdmin && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-3 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Admin
            </h3>
            <div className="space-y-1">
              <Link
                href="/admin"
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  pathname.startsWith('/admin')
                    ? 'bg-red-50 text-red-700 border-r-2 border-red-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                <Shield className="h-4 w-4" />
                Admin Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
