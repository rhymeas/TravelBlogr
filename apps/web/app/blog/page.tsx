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
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full">
                <Sparkles className="h-4 w-4 text-rausch-500" />
                <span className="text-sm font-medium text-gray-700">Travel Stories & Inspiration</span>
              </div>

              <h1 className="text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
                Where will your
                <span className="block text-rausch-500">story begin?</span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed">
                Discover real journeys from real travelers. Get inspired, plan better, and create memories that last forever.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/blog/posts"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-all hover:scale-105"
                >
                  Explore Stories
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/plan"
                  className="inline-flex items-center gap-2 px-8 py-4 border-2 border-gray-900 text-gray-900 rounded-full font-medium hover:bg-gray-50 transition-all"
                >
                  Plan Your Trip
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

      {/* Why Travel Section - Emotional */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-rausch-50 rounded-full">
                <Heart className="h-8 w-8 text-rausch-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Find Inspiration</h3>
              <p className="text-gray-600">
                Real stories from real travelers to spark your wanderlust and help you discover your next adventure.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-rausch-50 rounded-full">
                <Globe className="h-8 w-8 text-rausch-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Plan Smarter</h3>
              <p className="text-gray-600">
                Learn from others' experiences and get practical tips to make your trip planning easier and better.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-rausch-50 rounded-full">
                <Sparkles className="h-8 w-8 text-rausch-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Create Memories</h3>
              <p className="text-gray-600">
                Turn inspiration into action and create your own unforgettable travel stories to share with the world.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Simple and Elegant */}
      <section className="py-24 bg-gray-900">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-4xl lg:text-5xl font-bold text-white">
            Ready to start your journey?
          </h2>
          <p className="text-xl text-gray-300">
            Join thousands of travelers who plan their perfect trips with TravelBlogr
          </p>
          <Link
            href="/plan"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-full font-medium hover:bg-gray-100 transition-all hover:scale-105"
          >
            Plan Your Trip Now
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}

