'use client'

/**
 * Blog Homepage
 * 
 * Public-facing blog homepage with hero, destinations, testimonials, and newsletter.
 * Follows the design from the screenshot.
 */

import { DestinationsCarousel } from '@/components/blog/DestinationsCarousel'
import { TestimonialCard } from '@/components/blog/TestimonialCard'
import { FeatureList, TRIP_PLANNING_FEATURES } from '@/components/blog/FeatureList'
import { StatsBar } from '@/components/blog/StatsBar'
import { NewsletterSubscription } from '@/components/blog/NewsletterSubscription'
import { BlogLayout, BlogSection } from '@/components/blog/BlogLayout'
import { useBlogDestinations, useBlogTestimonials, useBlogStats } from '@/hooks/useBlogData'

export default function BlogHomepage() {
  const { destinations, isLoading: destinationsLoading } = useBlogDestinations({ featured: true, limit: 8 })
  const { testimonials, isLoading: testimonialsLoading } = useBlogTestimonials({ featured: true, limit: 3 })
  const { stats, isLoading: statsLoading } = useBlogStats()

  return (
    <BlogLayout maxWidth="2xl">
      {/* Page Header - Simple and Clean */}
      <BlogSection className="pt-12 pb-8">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Travel Stories & Guides
          </h1>
          <p className="text-xl text-gray-600">
            Discover inspiring journeys, expert tips, and destination guides from travelers around the world
          </p>
        </div>
      </BlogSection>

      {/* Trip Planning Features */}
      <BlogSection className="py-16 bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Plan Your Trip With Us
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to create the perfect travel experience
          </p>
        </div>
        <FeatureList
          features={TRIP_PLANNING_FEATURES}
          variant="grid"
          columns={2}
        />
      </BlogSection>

      {/* Popular Destinations */}
      <BlogSection className="py-16">
        <DestinationsCarousel
          destinations={destinations}
          isLoading={destinationsLoading}
          title="Popular Destinations"
          subtitle="Explore the world's most amazing places"
          variant="default"
        />
      </BlogSection>

      {/* Exploration CTA */}
      <BlogSection className="py-16 bg-gradient-to-r from-rausch-500 via-kazan-500 to-babu-500 text-white rounded-3xl">
        <div className="text-center max-w-3xl mx-auto px-6 py-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Choose Dream Destination For Explore World
          </h2>
          <p className="text-lg text-white/90 mb-8">
            Start your journey today and discover unforgettable experiences around the globe
          </p>
          <button className="bg-white text-rausch-600 px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            Explore Destinations
          </button>
        </div>
      </BlogSection>

      {/* Statistics */}
      <BlogSection className="py-16">
        <StatsBar
          stats={stats.map((stat: any) => ({
            label: stat.stat_label,
            value: stat.stat_value,
            icon: stat.icon,
            color: stat.color as any
          }))}
          variant="large"
          layout="horizontal"
        />
      </BlogSection>

      {/* Testimonials */}
      <BlogSection className="py-16 bg-gray-50">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            What Our Travelers Say
          </h2>
          <p className="text-lg text-gray-600">
            Real stories from real travelers
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonialsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse" />
            ))
          ) : (
            testimonials.map((testimonial: any) => (
              <TestimonialCard
                key={testimonial.id}
                testimonial={{
                  id: testimonial.id,
                  content: testimonial.content,
                  author: {
                    name: testimonial.author_name,
                    role: testimonial.author_role,
                    location: testimonial.author_location,
                    avatar: testimonial.author_avatar
                  },
                  rating: testimonial.rating,
                  trip: testimonial.trip_reference
                }}
                variant="default"
              />
            ))
          )}
        </div>
      </BlogSection>

      {/* Newsletter */}
      <BlogSection className="py-16">
        <NewsletterSubscription
          variant="default"
          title="Stay Updated"
          description="Get travel tips, destination guides, and exclusive offers delivered to your inbox."
        />
      </BlogSection>
    </BlogLayout>
  )
}

