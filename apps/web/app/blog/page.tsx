'use client'

/**
 * Blog Homepage - Redesigned
 *
 * Sleek, bubbly, emotional, spacey Airbnb-inspired design
 * Minimal colors, lots of white space, beautiful imagery
 */

import Link from 'next/link'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { ArrowRight, Sparkles, Heart, Globe } from 'lucide-react'

export default function BlogHomepage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Beautiful and Spacey */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-rausch-50 rounded-full">
                <Sparkles className="h-4 w-4 text-rausch-500" />
                <span className="text-sm font-medium text-rausch-700">Share Your Journey, Earn Money</span>
              </div>

              <h1 className="text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
                Turn your travels into
                <span className="block text-rausch-500">inspiring stories</span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed">
                Create beautiful trip guides in minutes with our AI-powered tools. Share your adventures, inspire others, and earn money through our affiliate program. It's that simple.
              </p>

              {/* Value Props */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-rausch-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-rausch-600 text-sm font-bold">✓</span>
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">Create stunning trip guides with AI assistance</p>
                    <p className="text-sm text-gray-600">Our smart tools help you write engaging content in minutes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-rausch-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-rausch-600 text-sm font-bold">✓</span>
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">Earn 70% commission on affiliate sales</p>
                    <p className="text-sm text-gray-600">Get paid when readers book through your recommendations</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-rausch-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-rausch-600 text-sm font-bold">✓</span>
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">Join a community of passionate travelers</p>
                    <p className="text-sm text-gray-600">Share tips, get feedback, and grow together</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/plan"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-rausch-500 text-white rounded-full font-medium hover:bg-rausch-600 transition-all hover:scale-105 shadow-lg shadow-rausch-500/30"
                >
                  Start Creating Free
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/blog/posts"
                  className="inline-flex items-center gap-2 px-8 py-4 border-2 border-gray-900 text-gray-900 rounded-full font-medium hover:bg-gray-50 transition-all"
                >
                  Read Stories
                </Link>
              </div>
            </div>

            {/* Right: Image Collage */}
            <div className="relative h-[600px]">
              {/* Large Image */}
              <div className="absolute top-0 right-0 w-3/4 h-3/5 rounded-3xl overflow-hidden shadow-2xl">
                <OptimizedImage
                  src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800"
                  alt="Mountain landscape"
                  width={600}
                  height={400}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Small Image 1 */}
              <div className="absolute bottom-20 left-0 w-2/5 h-2/5 rounded-3xl overflow-hidden shadow-xl">
                <OptimizedImage
                  src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400"
                  alt="Beach sunset"
                  width={300}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Small Image 2 */}
              <div className="absolute bottom-0 right-12 w-1/3 h-1/4 rounded-3xl overflow-hidden shadow-xl">
                <OptimizedImage
                  src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400"
                  alt="City skyline"
                  width={250}
                  height={200}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Stories - Clean Grid */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Latest Adventures
            </h2>
            <p className="text-lg text-gray-600">
              Fresh stories from travelers around the world
            </p>
          </div>

          {/* Story Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Placeholder cards - will be replaced with real blog posts */}
            {[1, 2, 3].map((i) => (
              <Link
                key={i}
                href="/blog/posts"
                className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden">
                  <OptimizedImage
                    src={`https://images.unsplash.com/photo-${1469854523086 + i}?w=600`}
                    alt="Travel destination"
                    width={600}
                    height={450}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>5 min read</span>
                    <span>•</span>
                    <span>2 days ago</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-rausch-500 transition-colors">
                    Amazing Journey Through Europe
                  </h3>
                  <p className="text-gray-600 line-clamp-2">
                    Discover the hidden gems and unforgettable experiences from a 2-week adventure across Europe.
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/blog/posts"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-all hover:scale-105"
            >
              View All Stories
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works - Step by Step */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">
              Start earning from your travel experiences in 3 simple steps
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="relative">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-rausch-500 text-white rounded-full text-2xl font-bold">
                  1
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Plan Your Trip</h3>
                <p className="text-gray-600">
                  Use our AI-powered trip planner to create a detailed itinerary. Add destinations, activities, and personal tips from your journey.
                </p>
              </div>
              {/* Connector Line */}
              <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-rausch-300 to-transparent" />
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-rausch-500 text-white rounded-full text-2xl font-bold">
                  2
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Publish & Share</h3>
                <p className="text-gray-600">
                  Transform your trip into a beautiful blog post with photos, maps, and recommendations. Our AI helps you write engaging content.
                </p>
              </div>
              {/* Connector Line */}
              <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-rausch-300 to-transparent" />
            </div>

            {/* Step 3 */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-rausch-500 text-white rounded-full text-2xl font-bold">
                3
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Earn Money</h3>
              <p className="text-gray-600">
                Get 70% commission when readers book hotels, tours, or flights through your affiliate links. Track your earnings in real-time.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 text-rausch-500 hover:text-rausch-600 font-medium"
            >
              Learn more about earning with TravelBlogr
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Community Engagement */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-rausch-50 rounded-full">
                <Heart className="h-8 w-8 text-rausch-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Supportive Community</h3>
              <p className="text-gray-600">
                Join thousands of travel creators sharing tips, feedback, and inspiration. Get help from experienced bloggers.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-rausch-50 rounded-full">
                <Globe className="h-8 w-8 text-rausch-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Global Reach</h3>
              <p className="text-gray-600">
                Your stories reach travelers worldwide. Build your audience and establish yourself as a trusted travel expert.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-rausch-50 rounded-full">
                <Sparkles className="h-8 w-8 text-rausch-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">AI-Powered Tools</h3>
              <p className="text-gray-600">
                Our smart writing assistant helps you create professional content faster. Focus on your experiences, we handle the rest.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Simple and Elegant */}
      <section className="py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-4">
            <Sparkles className="h-4 w-4 text-rausch-400" />
            <span className="text-sm font-medium text-white">Free to start, easy to earn</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white">
            Your next adventure could pay for itself
          </h2>
          <p className="text-xl text-gray-300">
            Join 10,000+ travel creators earning money from their journeys. Start creating your first trip guide today—it's completely free.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/plan"
              className="inline-flex items-center gap-2 px-8 py-4 bg-rausch-500 text-white rounded-full font-medium hover:bg-rausch-600 transition-all hover:scale-105 shadow-lg shadow-rausch-500/30"
            >
              Create Your First Trip
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white rounded-full font-medium hover:bg-white/20 transition-all border border-white/20"
            >
              See How It Works
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-4">
            No credit card required • 70% commission rate • Instant payouts
          </p>
        </div>
      </section>
    </div>
  )
}

