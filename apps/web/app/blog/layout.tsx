import { Metadata } from 'next'
import Link from 'next/link'
import { FileText, Home, MapPin } from 'lucide-react'

export const metadata: Metadata = {
  title: {
    default: 'TravelBlogr Blog - Travel Stories & Guides',
    template: '%s | TravelBlogr Blog'
  },
  description: 'Discover inspiring travel stories, destination guides, and tips from our community of travelers. Plan your perfect trip with AI-powered itineraries.',
  keywords: ['travel blog', 'travel guides', 'destination guides', 'travel tips', 'trip planning', 'travel stories'],
  authors: [{ name: 'TravelBlogr' }],
  creator: 'TravelBlogr',
  publisher: 'TravelBlogr',
  openGraph: {
    title: 'TravelBlogr Blog',
    description: 'Discover inspiring travel stories, destination guides, and tips from our community of travelers.',
    type: 'website',
    locale: 'en_US',
    url: 'https://travelblogr.com/blog',
    siteName: 'TravelBlogr',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TravelBlogr Blog',
    description: 'Discover inspiring travel stories, destination guides, and tips from our community of travelers.',
    creator: '@travelblogr',
  },
  alternates: {
    types: {
      'application/rss+xml': 'https://travelblogr.com/blog/feed.xml',
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Main Content - No redundant header, use legacy AuthAwareHeader */}
      <main>{children}</main>
    </div>
  )
}

