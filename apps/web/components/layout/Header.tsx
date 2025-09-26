'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Menu, X, MapPin } from 'lucide-react'

const navigation = [
  { name: 'Locations', href: '/locations' },
  { name: 'Live Feed', href: '/live-feed' },
  { name: 'Features', href: '#features' },
  { name: 'How it Works', href: '#how-it-works' },
  { name: 'Examples', href: '/examples' },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-gray-300 shadow-airbnb-light">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8" aria-label="Global">
        {/* Logo */}
        <div className="flex lg:flex-1">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-rausch-500 rounded-lg flex items-center justify-center">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <span className="text-title-medium text-airbnb-black font-semibold">TravelBlogr</span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Menu className="h-6 w-6 text-airbnb-black" aria-hidden="true" />
          </button>
        </div>

        {/* Desktop navigation */}
        <div className="hidden lg:flex lg:items-center lg:gap-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-body-large font-medium text-airbnb-black hover:text-airbnb-dark-gray transition-colors py-2 px-3 rounded-lg hover:bg-gray-50"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Desktop auth buttons */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-3">
          <Link
            href="/auth/signin"
            className="text-body-large font-medium text-airbnb-black hover:text-airbnb-dark-gray transition-colors py-2 px-4 rounded-lg hover:bg-gray-50"
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="btn-primary text-body-large font-semibold px-6 py-3 rounded-airbnb-small hover:scale-105 transition-transform"
          >
            Get Started
          </Link>
        </div>
      </nav>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm shadow-airbnb-xl">
            <div className="flex items-center justify-between mb-8">
              <Link href="/" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                <div className="w-8 h-8 bg-rausch-500 rounded-lg flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <span className="text-title-medium text-airbnb-black font-semibold">TravelBlogr</span>
              </Link>
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <X className="h-6 w-6 text-airbnb-black" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-1 mb-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-4 py-3 text-body-large font-medium text-airbnb-black hover:bg-gray-50 rounded-airbnb-small transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="space-y-3 border-t border-gray-200 pt-6">
              <Link
                href="/auth/signin"
                className="block w-full text-center py-3 px-4 text-body-large font-medium text-airbnb-black border border-gray-300 rounded-airbnb-small hover:bg-gray-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="block w-full text-center btn-primary py-3 px-4 rounded-airbnb-small"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
