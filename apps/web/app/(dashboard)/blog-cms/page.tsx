'use client'

/**
 * Blog CMS Dashboard
 * 
 * Admin dashboard for managing blog content, destinations, testimonials, and stats.
 * 
 * Features:
 * - Content block management
 * - Blog post management
 * - Destination management
 * - Testimonial management
 * - Newsletter subscribers
 * - Analytics
 */

import { useState } from 'react'
import { FileText, MapPin, MessageSquare, Users, BarChart3, Settings } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ContentBlockManager } from '@/components/blog/ContentBlockManager'

type TabType = 'posts' | 'destinations' | 'testimonials' | 'newsletter' | 'analytics' | 'settings'

export default function BlogCMSPage() {
  const [activeTab, setActiveTab] = useState<TabType>('posts')

  const tabs = [
    { id: 'posts' as TabType, label: 'Blog Posts', icon: FileText },
    { id: 'destinations' as TabType, label: 'Destinations', icon: MapPin },
    { id: 'testimonials' as TabType, label: 'Testimonials', icon: MessageSquare },
    { id: 'newsletter' as TabType, label: 'Newsletter', icon: Users },
    { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3 },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Blog CMS</h1>
            <p className="text-gray-600 mt-1">Manage your blog content and settings</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-rausch-500 text-rausch-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'posts' && <BlogPostsTab />}
        {activeTab === 'destinations' && <DestinationsTab />}
        {activeTab === 'testimonials' && <TestimonialsTab />}
        {activeTab === 'newsletter' && <NewsletterTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  )
}

// Tab Components

function BlogPostsTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Blog Posts</h2>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      <Card className="p-6">
        <p className="text-gray-500 text-center py-12">
          Blog post management coming soon...
        </p>
      </Card>
    </div>
  )
}

function DestinationsTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Popular Destinations</h2>
        <Button>
          <MapPin className="h-4 w-4 mr-2" />
          Add Destination
        </Button>
      </div>

      <Card className="p-6">
        <p className="text-gray-500 text-center py-12">
          Destination management coming soon...
        </p>
      </Card>
    </div>
  )
}

function TestimonialsTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Testimonials</h2>
        <Button>
          <MessageSquare className="h-4 w-4 mr-2" />
          Add Testimonial
        </Button>
      </div>

      <Card className="p-6">
        <p className="text-gray-500 text-center py-12">
          Testimonial management coming soon...
        </p>
      </Card>
    </div>
  )
}

function NewsletterTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Newsletter Subscribers</h2>
        <Button variant="outline">
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">Total Subscribers</div>
          <div className="text-3xl font-bold text-gray-900">0</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">This Month</div>
          <div className="text-3xl font-bold text-green-600">+0</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">Unsubscribed</div>
          <div className="text-3xl font-bold text-gray-400">0</div>
        </Card>
      </div>

      <Card className="p-6">
        <p className="text-gray-500 text-center py-12">
          Subscriber list coming soon...
        </p>
      </Card>
    </div>
  )
}

function AnalyticsTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">Page Views</div>
          <div className="text-3xl font-bold text-gray-900">0</div>
          <div className="text-xs text-green-600 mt-1">+0% from last month</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">Blog Posts</div>
          <div className="text-3xl font-bold text-gray-900">0</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">Destinations</div>
          <div className="text-3xl font-bold text-gray-900">0</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">Testimonials</div>
          <div className="text-3xl font-bold text-gray-900">0</div>
        </Card>
      </div>

      <Card className="p-6">
        <p className="text-gray-500 text-center py-12">
          Detailed analytics coming soon...
        </p>
      </Card>
    </div>
  )
}

function SettingsTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Blog Settings</h2>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Homepage Content Blocks</h3>
        <ContentBlockManager pageSlug="blog-homepage" isAdmin={true} />
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Settings</h3>
        <p className="text-gray-500 text-center py-12">
          SEO settings coming soon...
        </p>
      </Card>
    </div>
  )
}

