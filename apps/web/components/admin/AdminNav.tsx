'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Activity,
  Globe,
  Wand2,
  Image as ImageIcon,
  Users,
  BarChart3,
  DollarSign,
  Shield,
  TestTube2,
  FileText,
  Settings,
  Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  category?: string
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    description: 'Overview and quick stats',
    category: 'Main'
  },
  {
    name: 'Feature Flags',
    href: '/admin/feature-flags',
    icon: Settings,
    description: 'Toggle experimental features',
    category: 'Configuration'
  },
  {
    name: 'AI Monitoring',
    href: '/admin/ai-monitoring',
    icon: Activity,
    description: 'Track AI requests and costs',
    category: 'Monitoring'
  },
  {
    name: 'Crawler',
    href: '/admin/crawler',
    icon: Globe,
    description: 'Content crawler dashboard',
    category: 'Content'
  },
  {
    name: 'Auto-Fill',
    href: '/admin/auto-fill',
    icon: Wand2,
    description: 'Auto-populate location data',
    category: 'Content'
  },
  {
    name: 'Image Management',
    href: '/admin/images',
    icon: ImageIcon,
    description: 'Manage location images',
    category: 'Content'
  },
  {
    name: 'Location Cleanup',
    href: '/admin/location-cleanup',
    icon: Trash2,
    description: 'Clean up location names',
    category: 'Content'
  },
  {
    name: 'User Management',
    href: '/admin/users',
    icon: Users,
    description: 'Manage users and permissions',
    category: 'Users'
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    description: 'Platform analytics',
    category: 'Monitoring'
  },
  {
    name: 'Cost Tracking',
    href: '/admin/costs',
    icon: DollarSign,
    description: 'Monitor service costs',
    category: 'Monitoring'
  },
  {
    name: 'Reddit Images',
    href: '/test/reddit-images',
    icon: TestTube2,
    description: 'Test Reddit ULTRA image fetching',
    category: 'Testing'
  },
  {
    name: 'Blog CMS',
    href: '/blog-cms',
    icon: FileText,
    description: 'Edit and manage blog posts',
    category: 'Content'
  }
]

// Group items by category
const groupedItems = navItems.reduce((acc, item) => {
  const category = item.category || 'Other'
  if (!acc[category]) acc[category] = []
  acc[category].push(item)
  return acc
}, {} as Record<string, NavItem[]>)

const categoryOrder = ['Main', 'Content', 'Users', 'Monitoring', 'Configuration', 'Testing', 'Other']

export function AdminNav() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-6">
        {/* Logo */}
        <Link href="/admin" className="flex items-center gap-2 mb-8">
          <Shield className="h-8 w-8 text-red-600" />
          <span className="text-xl font-bold text-gray-900">Admin</span>
        </Link>

        {/* Navigation Items - Grouped by Category */}
        <nav className="space-y-6">
          {categoryOrder.map((category) => {
            const items = groupedItems[category]
            if (!items) return null

            return (
              <div key={category}>
                {category !== 'Main' && (
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
                    {category}
                  </h3>
                )}
                <div className="space-y-1">
                  {items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group',
                          isActive
                            ? 'bg-red-50 text-red-700 border-r-2 border-red-700'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        )}
                        title={item.description}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span className="flex-1">{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

// Compact version for page headers
export function AdminBreadcrumb({ currentPage }: { currentPage: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Link href="/admin" className="hover:text-gray-900">
        Admin
      </Link>
      <span>/</span>
      <span className="text-gray-900 font-medium">{currentPage}</span>
    </div>
  )
}

