'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { 
  Home, 
  Plane, 
  Compass, 
  Camera, 
  User, 
  Plus,
  Bell,
  Search,
  Menu,
  X
} from 'lucide-react'

interface MobileNavigationProps {
  className?: string
}

export function MobileNavigation({ className = '' }: MobileNavigationProps) {
  const pathname = usePathname()
  const [notificationCount, setNotificationCount] = useState(0)

  // Mock notification count - would come from real API
  useEffect(() => {
    setNotificationCount(3)
  }, [])

  const navItems = [
    {
      href: '/dashboard',
      icon: Home,
      label: 'Home',
      badge: null
    },
    {
      href: '/dashboard/trips',
      icon: Plane,
      label: 'Trips',
      badge: null
    },
    {
      href: '/dashboard/trips/new',
      icon: Plus,
      label: 'Create',
      badge: null,
      isAction: true
    },
    {
      href: '/dashboard/social',
      icon: Compass,
      label: 'Discover',
      badge: null
    },
    {
      href: '/dashboard/profile',
      icon: User,
      label: 'Profile',
      badge: notificationCount > 0 ? notificationCount : null
    }
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden",
        "safe-area-inset-bottom", // For devices with home indicator
        className
      )}>
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-w-0 flex-1",
                  "relative",
                  active 
                    ? "text-blue-600 bg-blue-50" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                  item.isAction && "bg-blue-600 text-white hover:bg-blue-700 mx-1 rounded-full"
                )}
              >
                <div className="relative">
                  <Icon className={cn(
                    "h-5 w-5 mb-1",
                    item.isAction && "h-6 w-6"
                  )} />
                  
                  {item.badge && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-xs"
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </Badge>
                  )}
                </div>
                
                <span className={cn(
                  "text-xs font-medium truncate",
                  item.isAction && "sr-only"
                )}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <div className="h-16 md:hidden" />
    </>
  )
}

// Mobile Header Component
interface MobileHeaderProps {
  title?: string
  showSearch?: boolean
  showNotifications?: boolean
  onMenuClick?: () => void
  className?: string
}

export function MobileHeader({ 
  title = 'TravelBlogr',
  showSearch = false,
  showNotifications = true,
  onMenuClick,
  className = ''
}: MobileHeaderProps) {
  const [notificationCount, setNotificationCount] = useState(0)

  useEffect(() => {
    setNotificationCount(3)
  }, [])

  return (
    <header className={cn(
      "sticky top-0 z-40 bg-white border-b border-gray-200 md:hidden",
      "safe-area-inset-top", // For devices with notch
      className
    )}>
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {title}
          </h1>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {showSearch && (
            <Link
              href="/dashboard/search"
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <Search className="h-5 w-5" />
            </Link>
          )}
          
          {showNotifications && (
            <Link
              href="/dashboard/notifications"
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg relative"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Badge>
              )}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

// Mobile Drawer/Sidebar Component
interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function MobileDrawer({ 
  isOpen, 
  onClose, 
  children, 
  className = '' 
}: MobileDrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black bg-opacity-50 md:hidden"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={cn(
        "fixed top-0 left-0 bottom-0 z-50 w-80 max-w-[85vw] bg-white shadow-xl md:hidden",
        "transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  )
}

// Pull to Refresh Component
interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  className?: string
}

export function PullToRefresh({ 
  onRefresh, 
  children, 
  className = '' 
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setIsPulling(true)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPulling && window.scrollY === 0) {
      const touch = e.touches[0]
      const distance = Math.max(0, touch.clientY - 100) // Adjust threshold
      setPullDistance(Math.min(distance, 100)) // Max pull distance
    }
  }

  const handleTouchEnd = async () => {
    if (isPulling && pullDistance > 50) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
    setIsPulling(false)
    setPullDistance(0)
  }

  return (
    <div 
      className={cn("relative", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      {(isPulling || isRefreshing) && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-blue-50 border-b border-blue-200 transition-all duration-200"
          style={{ 
            height: `${Math.max(pullDistance, isRefreshing ? 60 : 0)}px`,
            transform: `translateY(-${Math.max(pullDistance, isRefreshing ? 60 : 0)}px)`
          }}
        >
          <div className="flex items-center gap-2 text-blue-600">
            <div className={cn(
              "w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full",
              isRefreshing && "animate-spin"
            )} />
            <span className="text-sm font-medium">
              {isRefreshing ? 'Refreshing...' : pullDistance > 50 ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </div>
        </div>
      )}
      
      {children}
    </div>
  )
}
