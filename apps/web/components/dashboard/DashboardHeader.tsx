'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { Bell, Search, ChevronDown, LogOut, Settings, User as UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { signOut } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface DashboardHeaderProps {
  user: User
  profile?: any
}

export function DashboardHeader({ user, profile }: DashboardHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
      toast.success('Signed out successfully')
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out')
    } finally {
      setIsSigningOut(false)
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

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search trips, posts..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </Button>

          {/* User Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2"
            >
              <div className="h-8 w-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || user.email}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  getInitials(profile?.full_name, user.email)
                )}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-gray-900">
                  {profile?.full_name || 'User'}
                </div>
                <div className="text-xs text-gray-500">
                  {user.email}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </Button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-md shadow-lg border z-50">
                <div className="py-1">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-900">
                      {profile?.full_name || 'User'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.email}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      router.push('/dashboard/settings/profile')
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <UserIcon className="h-4 w-4 mr-2" />
                    Profile
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      router.push('/dashboard/settings')
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </button>
                  
                  <div className="border-t border-gray-100">
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        handleSignOut()
                      }}
                      disabled={isSigningOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {isSigningOut ? 'Signing out...' : 'Sign out'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  )
}
