'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Globe, Menu, X, Plane, User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, profile, isAuthenticated, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-rausch-500 to-rausch-600 rounded-lg flex items-center justify-center">
              <Plane className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">TravelBlogr</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-gray-700 hover:text-rausch-500 transition-colors">
              Home
            </Link>
            <Link href="/plan" className="text-gray-700 hover:text-rausch-500 transition-colors font-medium">
              Plan your trip
            </Link>
            <Link href="/blog" className="text-gray-700 hover:text-rausch-500 transition-colors">
              Blog
            </Link>
            <Link href="/how-it-works" className="text-gray-700 hover:text-rausch-500 transition-colors">
              How It Works
            </Link>
            <Link href="/locations" className="text-gray-700 hover:text-rausch-500 transition-colors">
              Locations
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live</span>
            </div>
            {isAuthenticated ? (
              <>
                <Link href="/trips">
                  <Button variant="outline" size="sm">
                    My Trips
                  </Button>
                </Link>
                <div className="flex items-center gap-2">
                  <Link href="/profile" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.full_name || 'User'} className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-rausch-500 flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      {profile?.full_name || profile?.username || user?.email?.split('@')[0]}
                    </span>
                  </Link>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Button size="sm" className="bg-rausch-500 hover:bg-rausch-600">
                  Share Story
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-rausch-500 hover:bg-gray-100"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col gap-4">
              <Link
                href="/"
                className="text-gray-700 hover:text-rausch-500 transition-colors px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/plan"
                className="text-gray-700 hover:text-rausch-500 transition-colors px-2 py-1 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Plan your trip
              </Link>
              <Link
                href="/blog"
                className="text-gray-700 hover:text-rausch-500 transition-colors px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Blog
              </Link>
              <Link
                href="/how-it-works"
                className="text-gray-700 hover:text-rausch-500 transition-colors px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link
                href="/locations"
                className="text-gray-700 hover:text-rausch-500 transition-colors px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Locations
              </Link>
              <Link
                href="/examples"
                className="text-gray-700 hover:text-rausch-500 transition-colors px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Examples
              </Link>
              <div className="flex flex-col gap-2 pt-4 border-t border-gray-200">
                {isAuthenticated ? (
                  <>
                    <Link href="/trips" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full">
                        My Trips
                      </Button>
                    </Link>
                    <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full">
                        <User className="h-4 w-4 mr-2" />
                        {profile?.full_name || profile?.username || 'Profile'}
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        handleSignOut()
                        setIsMenuOpen(false)
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/signin" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full">
                        Sign In
                      </Button>
                    </Link>
                    <Button size="sm" className="w-full bg-rausch-500 hover:bg-rausch-600">
                      Share Story
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
