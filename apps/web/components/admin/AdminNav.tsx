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
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    description: 'Overview and quick stats'
  },
  {
    name: 'Feature Flags',
    href: '/admin/feature-flags',
    icon: Settings,
    description: 'Toggle experimental features'
  },
  {
    name: 'AI Monitoring',
    href: '/admin/ai-monitoring',
    icon: Activity,
    description: 'Track AI requests and costs'
  },
  {
    name: 'Crawler',
    href: '/admin/crawler',
    icon: Globe,
    description: 'Content crawler dashboard'
  },
  {
    name: 'Auto-Fill',
    href: '/admin/auto-fill',
    icon: Wand2,
    description: 'Auto-populate location data'
  },
  {
    name: 'Image Management',
    href: '/admin/images',
    icon: ImageIcon,
    description: 'Manage location images'
  },
  {
    name: 'User Management',
    href: '/admin/users',
    icon: Users,
    description: 'Manage users and permissions'
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    description: 'Platform analytics'
  },
  {
    name: 'Cost Tracking',
    href: '/admin/costs',
    icon: DollarSign,
    description: 'Monitor service costs'
  },
  {
    name: 'Reddit Images',
    href: '/test/reddit-images',
    icon: TestTube2,
    description: 'Test Reddit ULTRA image fetching'
  },
  {
    name: 'Blog CMS',
    href: '/blog-cms',
    icon: FileText,
    description: 'Edit and manage blog posts'
  }
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo/Title */}
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-red-600" />
            <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-red-50 text-red-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                  title={item.description}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* Mobile Menu Button */}
          <button className="lg:hidden p-2 text-gray-600 hover:text-gray-900">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden pb-4">
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-red-50 text-red-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
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

