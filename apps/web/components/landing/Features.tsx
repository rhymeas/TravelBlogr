import React from 'react'
import Link from 'next/link'
import {
  Users,
  Shield,
  Camera,
  MapPin,
  Share2,
  Smartphone,
  Globe,
  Heart,
  Briefcase,
  ArrowRight
} from 'lucide-react'

const features = [
  {
    name: 'Audience-Specific Sharing',
    description: 'Create different views of the same trip for family, friends, and professional networks.',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    name: 'Privacy Controls',
    description: 'Granular privacy settings ensure the right people see the right content.',
    icon: Shield,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    name: 'Beautiful Media Management',
    description: 'Upload, organize, and showcase your photos and videos with ease.',
    icon: Camera,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    name: 'Interactive Maps',
    description: 'Show your journey with beautiful, interactive maps and location tracking.',
    icon: MapPin,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  {
    name: 'Smart Sharing Links',
    description: 'Generate custom links that adapt content based on who is viewing.',
    icon: Share2,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  {
    name: 'Mobile Optimized',
    description: 'Perfect experience on all devices with real-time updates and offline support.',
    icon: Smartphone,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
]

const audienceTypes = [
  {
    name: 'Public Portfolio',
    description: 'Professional travel content for your career and networking',
    icon: Globe,
    example: 'Clean, professional layout with highlights and achievements'
  },
  {
    name: 'Family Updates',
    description: 'Personal moments and detailed updates for loved ones',
    icon: Heart,
    example: 'Intimate photos, daily updates, and location sharing'
  },
  {
    name: 'Professional Network',
    description: 'Business travel insights and industry connections',
    icon: Briefcase,
    example: 'Conference highlights, networking events, and insights'
  },
]

export function Features() {
  return (
    <>
    <section className="py-20 sm:py-32 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-display-small text-sleek-black mb-4">
            Share Stories That Matter, Plan Trips That Inspire
          </h2>
          <p className="text-body-large text-sleek-dark-gray leading-relaxed">
            TravelBlogr bridges the gap between travel sharing and trip planning. Your authentic stories become planning gold for fellow travelers, while their detailed experiences help you discover and plan your next adventure.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={feature.name}
              className="card-elevated p-8 hover:shadow-sleek-large transition-all duration-300 group"
            >
              {/* Icon */}
              <div className="w-12 h-12 bg-rausch-500 rounded-sleek-medium flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className="h-6 w-6 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-title-small text-sleek-black mb-3 font-semibold">
                {feature.name}
              </h3>
              <p className="text-body-large text-sleek-dark-gray leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>

    {/* Audience Types Section */}
    <section className="py-20 sm:py-32 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h3 className="text-display-small text-sleek-black mb-4">
            One trip, three different stories
          </h3>
          <p className="text-body-large text-sleek-dark-gray leading-relaxed">
            Share the same journey in completely different ways depending on your audience.
            Each view is perfectly tailored for its intended viewers.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {audienceTypes.map((type, index) => (
            <div
              key={type.name}
              className="card-elevated p-8 hover:shadow-sleek-large transition-all duration-300 group"
            >
              {/* Icon */}
              <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-sleek-medium flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <type.icon className="h-6 w-6 text-sleek-black" />
              </div>

              {/* Content */}
              <h4 className="text-title-small text-sleek-black mb-3 font-semibold">
                {type.name}
              </h4>
              <p className="text-body-large text-sleek-dark-gray mb-6 leading-relaxed">
                {type.description}
              </p>

              {/* Example */}
              <div className="bg-gray-50 rounded-sleek-small p-4 border border-gray-100">
                <p className="text-body-medium text-sleek-dark-gray">
                  <span className="font-semibold text-sleek-black">Example:</span> {type.example}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <Link
            href="/auth/signup"
            className="btn-primary px-8 py-4 text-body-large font-semibold rounded-sleek-small hover:scale-105 transition-transform inline-flex items-center gap-2"
          >
            Start Creating Your Stories
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
    </>
  )
}
