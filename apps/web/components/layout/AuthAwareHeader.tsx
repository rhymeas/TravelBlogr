'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Globe,
  Menu,
  ChevronDown,
  User as UserIcon,
  Settings,
  LogOut,
  Plus,
  MapPin,
  Camera,
  CreditCard,
  Wallet,
  Home,
  Compass,
  BookOpen,
  Newspaper,
  LayoutDashboard,
  Plane,
  Coins,
  FileText,
  DollarSign,
  Lightbulb
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { HeaderLogo } from '@/components/ui/Logo'
import { LoadingSpinner, LoadingSkeleton } from '@/components/ui/LoadingSpinner'
import { useAuth } from '../../hooks/useAuth'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { useUserCredits } from '@/hooks/useUserCredits'
import { CreditsModal } from '@/components/credits/CreditsModal'
import toast from 'react-hot-toast'

// Helper function to get role badge info
const getRoleBadge = (role?: string, unlimitedUntil?: string, couponType?: string) => {
  // Check if user has unlimited access
  if (unlimitedUntil && new Date(unlimitedUntil) > new Date()) {
    return {
      label: 'Plus',
      color: 'bg-yellow-500',
      textColor: 'text-white'
    }
  }

  // Check for special coupon types (family, friend, etc.)
  if (couponType) {
    const couponLabels: Record<string, { label: string; color: string }> = {
      'family': { label: 'Family', color: 'bg-purple-500' },
      'friend': { label: 'Friend', color: 'bg-blue-500' },
      'vip': { label: 'VIP', color: 'bg-pink-500' }
    }

    if (couponLabels[couponType]) {
      return {
        label: couponLabels[couponType].label,
        color: couponLabels[couponType].color,
        textColor: 'text-white'
      }
    }
  }

  // Check role
  switch (role) {
    case 'admin':
      return {
        label: 'Admin',
        color: 'bg-red-500',
        textColor: 'text-white'
      }
    case 'moderator':
      return {
        label: 'Mod',
        color: 'bg-blue-600',
        textColor: 'text-white'
      }
    case 'plus':
      return {
        label: 'Plus',
        color: 'bg-yellow-500',
        textColor: 'text-white'
      }
    default:
      return null
  }
}

export function AuthAwareHeader() {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showTripsMenu, setShowTripsMenu] = useState(false)
  const [showBlogMenu, setShowBlogMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showCreditsModal, setShowCreditsModal] = useState(false)
  const { user, profile, signOut, isAuthenticated, isLoading } = useAuth()
  const { showSignIn } = useAuthModal()
  const { credits, loading: creditsLoading } = useUserCredits()
  const pathname = usePathname()

  // Get role badge info
  const roleBadge = getRoleBadge(profile?.role, profile?.unlimited_until, profile?.coupon_type)

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
      setShowUserMenu(false)
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  // Don't wait for auth to load - render header immediately
  // Show loading state in the user menu area only

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-sleek-border shadow-sleek-light">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8" aria-label="Global">
        {/* Logo - Trim Sheet Layout: Logo left, fonts right */}
        <div className="flex lg:flex-1">
          <HeaderLogo />
        </div>

        {/* Desktop Navigation - TripAdvisor Style */}
        <div className="hidden lg:flex lg:gap-x-2">
          <Link
            href="/plan"
            className="px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          >
            Plan your trip
          </Link>

          {/* Blog Dropdown */}
          <div
            className="relative group"
            onMouseEnter={() => setShowBlogMenu(true)}
            onMouseLeave={() => setShowBlogMenu(false)}
          >
            <button
              onClick={() => setShowBlogMenu(!showBlogMenu)}
              className="flex items-center gap-1 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            >
              Blog
              <ChevronDown className={`h-4 w-4 transition-transform ${showBlogMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Invisible bridge to prevent dropdown from closing */}
            {showBlogMenu && (
              <div className="absolute left-0 top-full h-2 w-full" />
            )}

            {showBlogMenu && (
              <div className="absolute left-0 top-full pt-2 w-64 z-50">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 py-3">
                  <Link
                    href="/blog"
                    className="block px-5 py-3 text-sm text-gray-900 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowBlogMenu(false)}
                  >
                    <div className="font-semibold">Blog Home</div>
                    <div className="text-xs text-gray-500 mt-0.5">Travel stories & guides</div>
                  </Link>
                  <Link
                    href="/blog/posts"
                    className="block px-5 py-3 text-sm text-gray-900 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowBlogMenu(false)}
                  >
                    <div className="font-semibold">All Posts</div>
                    <div className="text-xs text-gray-500 mt-0.5">Browse all blog posts</div>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Trips Dropdown - TripAdvisor Style with improved hover */}
          <div
            className="relative group"
            onMouseEnter={() => setShowTripsMenu(true)}
            onMouseLeave={() => setShowTripsMenu(false)}
          >
            <button
              onClick={() => setShowTripsMenu(!showTripsMenu)}
              className="flex items-center gap-1 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            >
              Trips
              <ChevronDown className={`h-4 w-4 transition-transform ${showTripsMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Invisible bridge to prevent dropdown from closing */}
            {showTripsMenu && (
              <div className="absolute left-0 top-full h-2 w-full" />
            )}

            {showTripsMenu && (
              <div className="absolute left-0 top-full pt-2 w-64 z-50">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 py-3">
                  <Link
                    href="/trips-library"
                    className="block px-5 py-3 text-sm text-gray-900 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowTripsMenu(false)}
                  >
                    <div className="font-semibold">Trips Library</div>
                    <div className="text-xs text-gray-500 mt-0.5">Browse community & public trips</div>
                  </Link>
                  <div className="border-t border-gray-100 my-2" />
                  {isAuthenticated ? (
                    <Link
                      href="/dashboard/trips"
                      className="block px-5 py-3 text-sm text-gray-900 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowTripsMenu(false)}
                    >
                      <div className="font-semibold">View my trips</div>
                    </Link>
                  ) : (
                    <button
                      onClick={() => {
                        setShowTripsMenu(false)
                        showSignIn('/dashboard/trips')
                      }}
                      className="block px-5 py-3 text-sm text-gray-900 hover:bg-gray-50 transition-colors w-full text-left"
                    >
                      <div className="font-semibold">View my trips</div>
                    </button>
                  )}
                  <Link
                    href="/dashboard/trips/new"
                    className="block px-5 py-3 text-sm text-gray-900 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowTripsMenu(false)}
                  >
                    <div className="font-semibold">Start a new trip</div>
                  </Link>
                  <Link
                    href="/plan"
                    className="block px-5 py-3 text-sm text-gray-900 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowTripsMenu(false)}
                  >
                    <div className="font-semibold">Create trip with AI</div>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/locations"
            className="px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          >
            Locations
          </Link>

          <Link
            href="/live-feed"
            className="px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          >
            Live Feed
          </Link>

          <Link
            href="/how-it-works"
            className="px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          >
            How It Works
          </Link>
        </div>

        {/* Right side actions */}
        <div className="flex lg:flex-1 lg:justify-end items-center gap-4">
          {isLoading ? (
            // Loading state - show shimmer skeleton
            <>
              <div className="hidden lg:flex items-center gap-3">
                <LoadingSkeleton className="h-9 w-28" variant="rectangular" />
                <LoadingSkeleton className="h-8 w-8" variant="circular" />
              </div>
              <div className="lg:hidden flex items-center gap-2">
                <LoadingSpinner size="sm" variant="primary" />
              </div>
            </>
          ) : isAuthenticated ? (
            // Authenticated User Menu
            <div className="hidden lg:flex items-center gap-3">


              <Button
                asChild
                variant="outline"
                size="sm"
                className="btn-secondary"
              >
                <Link href="/dashboard/trips/new" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Trip
                </Link>
              </Button>

              {/* User Menu */}
              <div className="relative">
                <Button
                  variant="ghost"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-2"
                >
                  <div className="relative">
                    {(profile?.avatar_url || user?.user_metadata?.avatar_url) ? (
                      <img
                        src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                        alt={profile?.full_name || user?.user_metadata?.full_name || user?.email}
                        className="h-8 w-8 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          // Fallback to initials on error
                          const target = e.currentTarget
                          const parent = target.parentElement
                          if (parent) {
                            target.style.display = 'none'
                            const fallback = document.createElement('div')
                            fallback.className = 'h-8 w-8 bg-rausch-500 text-white rounded-full flex items-center justify-center text-sm font-medium'
                            fallback.textContent = getInitials(profile?.full_name || user?.user_metadata?.full_name, user?.email)
                            parent.appendChild(fallback)
                          }
                        }}
                      />
                    ) : (
                      <div className="h-8 w-8 bg-rausch-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {getInitials(profile?.full_name || user?.user_metadata?.full_name, user?.email)}
                      </div>
                    )}

                    {/* Role Badge */}
                    {roleBadge && (
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 ${roleBadge.color} ${roleBadge.textColor} text-[8px] font-bold px-1 py-0.5 rounded shadow-md ring-1 ring-white uppercase leading-none`}
                        title={roleBadge.label}
                      >
                        {roleBadge.label}
                      </div>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 text-sleek-gray" />
                </Button>

                {showUserMenu && (
                  <>
                    <div className="absolute right-0 top-full mt-1 w-56 card-elevated border border-sleek-border z-50">
                      <div className="py-1">
                        <div className="px-4 py-2 border-b border-sleek-border-light">
                          <div className="text-body-medium font-medium text-sleek-black">
                            {profile?.full_name || 'User'}
                          </div>
                          <div className="text-body-small text-sleek-gray">
                            {user?.email}
                          </div>
                        </div>

                        {/* Credits bubble - fully clickable */}
                        <Link
                          href="/credits"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center justify-between w-full px-4 py-3 border-b border-sleek-border-light bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center text-sm text-sleek-dark-gray">
                            <Coins className="h-4 w-4 mr-2" />
                            <span>Credits</span>
                          </div>
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 hover:scale-105 transition-all">
                            {creditsLoading ? '—' : credits}
                          </div>
                        </Link>

                        <Link
                          href="/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center w-full px-4 py-2 text-body-medium text-sleek-dark-gray hover:bg-gray-100 hover:rounded-lg transition-all mx-2"
                        >
                          <UserIcon className="h-4 w-4 mr-2" />
                          Dashboard
                        </Link>

                        <Link
                          href="/dashboard/trips"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center w-full px-4 py-2 text-body-medium text-sleek-dark-gray hover:bg-gray-100 hover:rounded-lg transition-all mx-2"
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          My Trips
                        </Link>


                        <div className="border-t border-sleek-border-light mt-1 pt-1">
                          <Link
                            href="/pricing"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center w-full px-4 py-2 text-body-medium text-sleek-dark-gray hover:bg-gray-100 hover:rounded-lg transition-all mx-2"
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Billing & Subscription
                          </Link>

                          <Link
                            href="/dashboard/credits"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center w-full px-4 py-2 text-body-medium text-sleek-dark-gray hover:bg-gray-100 hover:rounded-lg transition-all mx-2"
                          >
                            <Wallet className="h-4 w-4 mr-2" />
                            Credits & Usage
                          </Link>
                        </div>

                        <Link
                          href="/dashboard/settings"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center w-full px-4 py-2 text-body-medium text-sleek-dark-gray hover:bg-gray-100 hover:rounded-lg transition-all mx-2"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Link>

                        <div className="border-t border-sleek-border-light">
                          <button
                            onClick={handleSignOut}
                            className="flex items-center w-full px-4 py-2 text-body-medium text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign out
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Click outside to close menu */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />


                  </>
                )}
              </div>
            </div>
          ) : (
            // Non-authenticated User Actions
            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={() => showSignIn(pathname)}
                className="text-body-medium text-sleek-gray hover:text-sleek-black transition-colors"
              >
                Sign in
              </button>
              <Button asChild className="btn-primary">
                <Link href="/auth/signup">
                   Share Your Journey
                </Link>
              </Button>
            </div>
          )}

          {/* Mobile menu button */}
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden flex items-center gap-2"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <Menu className="h-4 w-4" />
            <span className="text-sm font-medium">Menu</span>
          </Button>
        </div>
      </nav>

      {/* Mobile Menu - Redesigned */}
      {showMobileMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setShowMobileMenu(false)}
          />

          {/* Menu */}
          <div className="lg:hidden border-t border-sleek-border bg-white shadow-lg fixed top-[60px] left-0 right-0 z-40">
            <div className="px-4 py-3 space-y-1 max-h-[calc(100vh-60px-64px)] overflow-y-auto pb-20 scrollbar-thin">
            {/* User Profile Section (if authenticated) */}
            {isAuthenticated && (
              <>
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg mb-2">
                  <div className="relative">
                    {(profile?.avatar_url || user?.user_metadata?.avatar_url) ? (
                      <img
                        src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                        alt={profile?.full_name || user?.user_metadata?.full_name || user?.email}
                        className="h-10 w-10 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="h-10 w-10 bg-rausch-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {getInitials(profile?.full_name || user?.user_metadata?.full_name, user?.email)}
                      </div>
                    )}

                    {/* Role Badge */}
                    {roleBadge && (
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 ${roleBadge.color} ${roleBadge.textColor} text-[8px] font-bold px-1 py-0.5 rounded shadow-md ring-1 ring-white uppercase leading-none`}
                        title={roleBadge.label}
                      >
                        {roleBadge.label}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {profile?.full_name || 'User'}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {user?.email}
                    </div>
                    {roleBadge && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleBadge.color} ${roleBadge.textColor}`}>
                          {roleBadge.label}
                        </span>
                      </div>
                    )}
                        {/* Mobile Credits Line */}
                        <div className="mt-1 text-xs text-gray-600 flex items-center gap-1">
                          <Coins className="h-3 w-3 text-gray-500" />
                          <span>Credits</span>
                          <span className="font-semibold text-gray-900 ml-1">{creditsLoading ? '\u2014' : credits}</span>
                        </div>

                  </div>
                </div>
                <div className="border-t border-gray-200 my-2" />
              </>
            )}

            {/* Main Navigation */}
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              onClick={() => setShowMobileMenu(false)}
            >
              <Home className="h-5 w-5 text-gray-600" />
              <span className="font-medium">Home</span>
            </Link>
            <Link
              href="/plan"
              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              onClick={() => setShowMobileMenu(false)}
            >
              <Compass className="h-5 w-5 text-gray-600" />
              <span className="font-medium">Plan Your Trip</span>
            </Link>
            <Link
              href="/trips-library"
              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              onClick={() => setShowMobileMenu(false)}
            >
              <BookOpen className="h-5 w-5 text-gray-600" />
              <span className="font-medium">Trips Library</span>
            </Link>
            {/* Blog Section with Submenu */}
            <div className="space-y-1">
              <Link
                href="/blog"
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                <FileText className="h-5 w-5 text-gray-600" />
                <span className="font-medium">Blog</span>
              </Link>
              <Link
                href="/blog/posts"
                className="flex items-center gap-3 px-4 py-3 pl-12 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                <span>All Posts</span>
              </Link>

            </div>

            <div className="border-t border-gray-200 my-2" />

            {/* Secondary Navigation */}
            <Link
              href="/locations"
              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              onClick={() => setShowMobileMenu(false)}
            >
              <MapPin className="h-5 w-5 text-gray-500" />
              <span>Locations</span>
            </Link>
            <Link
              href="/live-feed"
              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              onClick={() => setShowMobileMenu(false)}
            >
              <Newspaper className="h-5 w-5 text-gray-500" />
              <span>Live Feed</span>
            </Link>
            <Link
              href="/how-it-works"
              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              onClick={() => setShowMobileMenu(false)}
            >
              <Lightbulb className="h-5 w-5 text-gray-500" />
              <span>How It Works</span>
            </Link>

            <div className="border-t border-gray-200 my-2" />

            {/* User Actions */}
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <LayoutDashboard className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">Dashboard</span>
                </Link>
                <Link
                  href="/dashboard/trips"
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Plane className="h-5 w-5 text-gray-500" />
                  <span>My Trips</span>
                </Link>
                <Link
                  href="/dashboard/trips/new"
                  className="flex items-center gap-3 px-4 py-3 text-sm text-rausch-600 hover:bg-rausch-50 rounded-lg transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Plus className="h-5 w-5 text-rausch-600" />
                  <span className="font-semibold">Create Trip</span>
                </Link>

                <div className="border-t border-gray-200 my-2" />

                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Settings className="h-5 w-5 text-gray-500" />
                  <span>Settings</span>
                </Link>
                <button
                  onClick={() => {
                    handleSignOut()
                    setShowMobileMenu(false)
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full"
                >
                  <LogOut className="h-5 w-5 text-red-600" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setShowMobileMenu(false)
                    showSignIn(pathname)
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-900 hover:bg-gray-50 rounded-lg transition-colors w-full"
                >
                  <UserIcon className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">Sign In</span>
                </button>
                <Link
                  href="/auth/signup"
                  className="flex items-center gap-3 px-4 py-3 text-sm text-white bg-rausch-500 hover:bg-rausch-600 rounded-lg transition-colors font-semibold"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Camera className="h-5 w-5 text-white" />
                  <span> Share Your Journey</span>
                </Link>
              </>
            )}
          </div>
        </div>
        </>
      )}

      {/* Credits Modal */}
      <CreditsModal isOpen={showCreditsModal} onClose={() => setShowCreditsModal(false)} />
    </header>
  )
}
