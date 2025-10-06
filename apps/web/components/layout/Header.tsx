'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Globe, Menu, X, Plane } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
            <Link href="/live-feed" className="text-gray-700 hover:text-rausch-500 transition-colors">
              Live Feed
            </Link>
            <Link href="/locations" className="text-gray-700 hover:text-rausch-500 transition-colors">
              Locations
            </Link>
            <Link href="/examples" className="text-gray-700 hover:text-rausch-500 transition-colors">
              Examples
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live</span>
            </div>
            <Button variant="outline" size="sm">
              Sign In
            </Button>
            <Button size="sm" className="bg-rausch-500 hover:bg-rausch-600">
              Share Story
            </Button>
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
                href="/live-feed"
                className="text-gray-700 hover:text-rausch-500 transition-colors px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Live Feed
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
                <Button variant="outline" size="sm" className="w-full">
                  Sign In
                </Button>
                <Button size="sm" className="w-full bg-rausch-500 hover:bg-rausch-600">
                  Share Story
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
