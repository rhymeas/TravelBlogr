'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  Wallet
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { HeaderLogo } from '@/components/ui/Logo'
import { LoadingSpinner, LoadingSkeleton } from '@/components/ui/LoadingSpinner'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

export function AuthAwareHeader() {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showTripsMenu, setShowTripsMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const { user, profile, signOut, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

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
    <header className="bg-white sticky top-0 z-50 border-b border-airbnb-border shadow-airbnb-light">
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

          {/* Trips Dropdown - TripAdvisor Style with improved hover */}
          <div
            className="relative group"
            onMouseEnter={() => setShowTripsMenu(true)}
            onMouseLeave={() => setShowTripsMenu(false)}
          >
            <button
              className="flex items-center gap-1 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            >
              Trips
              <ChevronDown className="h-4 w-4" />
            </button>

            {/* Invisible bridge to prevent dropdown from closing */}
            {showTripsMenu && (
              <div className="absolute left-0 top-full h-2 w-full" />
            )}

            {showTripsMenu && (
              <div className="absolute left-0 top-full pt-2 w-64 z-50">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 py-3">
                  <Link
                    href={isAuthenticated ? "/dashboard/trips" : "/auth/signin?redirect=/dashboard/trips"}
                    className="block px-5 py-3 text-sm text-gray-900 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowTripsMenu(false)}
                  >
                    <div className="font-semibold">View my trips</div>
                  </Link>
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
                  <ChevronDown className="h-4 w-4 text-airbnb-gray" />
                </Button>

                {showUserMenu && (
                  <>
                    <div className="absolute right-0 top-full mt-1 w-56 card-elevated border border-airbnb-border z-50">
                      <div className="py-1">
                        <div className="px-4 py-2 border-b border-airbnb-border-light">
                          <div className="text-body-medium font-medium text-airbnb-black">
                            {profile?.full_name || 'User'}
                          </div>
                          <div className="text-body-small text-airbnb-gray">
                            {user?.email}
                          </div>
                        </div>
                        
                        <Link
                          href="/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center w-full px-4 py-2 text-body-medium text-airbnb-dark-gray hover:bg-airbnb-background-secondary transition-colors"
                        >
                          <UserIcon className="h-4 w-4 mr-2" />
                          Dashboard
                        </Link>
                        
                        <Link
                          href="/dashboard/trips"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center w-full px-4 py-2 text-body-medium text-airbnb-dark-gray hover:bg-airbnb-background-secondary transition-colors"
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          My Trips
                        </Link>

                        <div className="border-t border-airbnb-border-light mt-1 pt-1">
                          <Link
                            href="/pricing"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center w-full px-4 py-2 text-body-medium text-airbnb-dark-gray hover:bg-airbnb-background-secondary transition-colors"
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Billing & Subscription
                          </Link>

                          <Link
                            href="/dashboard/credits"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center w-full px-4 py-2 text-body-medium text-airbnb-dark-gray hover:bg-airbnb-background-secondary transition-colors"
                          >
                            <Wallet className="h-4 w-4 mr-2" />
                            Credits & Usage
                          </Link>
                        </div>

                        <Link
                          href="/dashboard/settings"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center w-full px-4 py-2 text-body-medium text-airbnb-dark-gray hover:bg-airbnb-background-secondary transition-colors"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Link>
                        
                        <div className="border-t border-airbnb-border-light">
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
              <Link href="/auth/signin" className="text-body-medium text-airbnb-gray hover:text-airbnb-black transition-colors">
                Sign in
              </Link>
              <Button asChild className="btn-primary">
                <Link href="/auth/signup">
                  Share Your Story
                </Link>
              </Button>
            </div>
          )}

          {/* Mobile menu button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="lg:hidden"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="lg:hidden border-t border-airbnb-border bg-white">
          <div className="px-6 py-4 space-y-4">
            <Link
              href="/plan"
              className="block text-body-medium text-airbnb-black hover:text-rausch-500 transition-colors font-medium"
              onClick={() => setShowMobileMenu(false)}
            >
              Plan your trip
            </Link>
            <Link
              href="/locations"
              className="block text-body-medium text-airbnb-dark-gray hover:text-airbnb-black transition-colors"
              onClick={() => setShowMobileMenu(false)}
            >
              Locations
            </Link>
            <Link
              href="/live-feed"
              className="block text-body-medium text-airbnb-dark-gray hover:text-airbnb-black transition-colors"
              onClick={() => setShowMobileMenu(false)}
            >
              Live Feed
            </Link>

            {isAuthenticated ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="block text-body-medium text-airbnb-dark-gray hover:text-airbnb-black transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/dashboard/trips/new" 
                  className="block text-body-medium text-rausch-500 hover:text-rausch-600 transition-colors font-medium"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Create Trip
                </Link>
                <button
                  onClick={() => {
                    handleSignOut()
                    setShowMobileMenu(false)
                  }}
                  className="block w-full text-left text-body-medium text-red-600 hover:text-red-700 transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/trips-library"
                  className="block text-body-medium text-airbnb-dark-gray hover:text-airbnb-black transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Trips Library
                </Link>
                <Link 
                  href="/auth/signin" 
                  className="block text-body-medium text-airbnb-dark-gray hover:text-airbnb-black transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Sign in
                </Link>
                <Link 
                  href="/auth/signup" 
                  className="block text-body-medium text-rausch-500 hover:text-rausch-600 transition-colors font-medium"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Share Your Story
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
