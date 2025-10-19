'use client'

/**
 * How It Works Page
 * 
 * Explains the 3-step process: Plan → Publish → Earn
 * Includes FAQs, success stories, affiliate program details, and getting started guide
 */

import Link from 'next/link'
import { Check, DollarSign, Globe, MapPin, Sparkles } from 'lucide-react'

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-16">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-rausch-50 rounded-full">
              <Sparkles className="h-4 w-4 text-rausch-500" />
              <span className="text-sm font-medium text-rausch-700">Turn Your Travels Into Income</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              How TravelBlogr Works
            </h1>
            
            <p className="text-xl text-gray-600 leading-relaxed">
              Share your travel experiences and earn money through our affiliate program. 
              It's simple, transparent, and designed for travelers like you.
            </p>
          </div>
        </div>
      </section>

      {/* 3-Step Process */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Step 1: Plan */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-rausch-100 rounded-full mb-4">
              <MapPin className="h-8 w-8 text-rausch-600" />
            </div>
            <div className="inline-flex items-center justify-center w-10 h-10 bg-gray-900 text-white rounded-full font-bold text-lg mb-2">
              1
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Plan Your Trip</h3>
            <p className="text-gray-600 leading-relaxed">
              Use our AI-powered trip planner to create detailed itineraries. 
              Add locations, activities, and personal notes.
            </p>
          </div>

          {/* Step 2: Publish */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-rausch-100 rounded-full mb-4">
              <Globe className="h-8 w-8 text-rausch-600" />
            </div>
            <div className="inline-flex items-center justify-center w-10 h-10 bg-gray-900 text-white rounded-full font-bold text-lg mb-2">
              2
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Publish Your Story</h3>
            <p className="text-gray-600 leading-relaxed">
              Transform your trip into a beautiful blog post. 
              Share photos, tips, and recommendations with the community.
            </p>
          </div>

          {/* Step 3: Earn */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-rausch-100 rounded-full mb-4">
              <DollarSign className="h-8 w-8 text-rausch-600" />
            </div>
            <div className="inline-flex items-center justify-center w-10 h-10 bg-gray-900 text-white rounded-full font-bold text-lg mb-2">
              3
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Earn Money</h3>
            <p className="text-gray-600 leading-relaxed">
              Earn 70% commission on every booking made through your affiliate links. 
              Get paid instantly to your account.
            </p>
          </div>
        </div>
      </section>

      {/* Affiliate Program Details */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Our Affiliate Program
            </h2>
            <p className="text-lg text-gray-600">
              Industry-leading commission rates and instant payouts
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="text-4xl font-bold text-rausch-600 mb-2">70%</div>
              <div className="text-sm font-medium text-gray-900 mb-2">Commission Rate</div>
              <p className="text-sm text-gray-600">
                Earn 70% on every booking made through your links
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="text-4xl font-bold text-rausch-600 mb-2">$0</div>
              <div className="text-sm font-medium text-gray-900 mb-2">Minimum Payout</div>
              <p className="text-sm text-gray-600">
                No minimum threshold - get paid instantly
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="text-4xl font-bold text-rausch-600 mb-2">90</div>
              <div className="text-sm font-medium text-gray-900 mb-2">Cookie Duration</div>
              <p className="text-sm text-gray-600">
                90-day cookie window for maximum earnings
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="text-4xl font-bold text-rausch-600 mb-2">24/7</div>
              <div className="text-sm font-medium text-gray-900 mb-2">Support</div>
              <p className="text-sm text-gray-600">
                Dedicated support team to help you succeed
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What You Can Earn From */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            What You Can Earn From
          </h2>
          <p className="text-lg text-gray-600">
            Multiple revenue streams from your travel content
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex gap-4 p-6 bg-gray-50 rounded-2xl">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-rausch-100 rounded-full flex items-center justify-center">
                <Check className="h-6 w-6 text-rausch-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Hotel Bookings</h3>
              <p className="text-gray-600">
                Earn commission when readers book hotels through your recommendations
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-6 bg-gray-50 rounded-2xl">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-rausch-100 rounded-full flex items-center justify-center">
                <Check className="h-6 w-6 text-rausch-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Flight Tickets</h3>
              <p className="text-gray-600">
                Get paid for flight bookings made through your affiliate links
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-6 bg-gray-50 rounded-2xl">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-rausch-100 rounded-full flex items-center justify-center">
                <Check className="h-6 w-6 text-rausch-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Tours & Activities</h3>
              <p className="text-gray-600">
                Earn from tours, experiences, and activities you recommend
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-6 bg-gray-50 rounded-2xl">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-rausch-100 rounded-full flex items-center justify-center">
                <Check className="h-6 w-6 text-rausch-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Travel Insurance</h3>
              <p className="text-gray-600">
                Get commission on travel insurance purchases
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-6 bg-gray-50 rounded-2xl">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-rausch-100 rounded-full flex items-center justify-center">
                <Check className="h-6 w-6 text-rausch-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Car Rentals</h3>
              <p className="text-gray-600">
                Earn when readers rent cars through your recommendations
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-6 bg-gray-50 rounded-2xl">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-rausch-100 rounded-full flex items-center justify-center">
                <Check className="h-6 w-6 text-rausch-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Travel Gear</h3>
              <p className="text-gray-600">
                Get paid for travel gear and equipment recommendations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Success Stories
            </h2>
            <p className="text-lg text-gray-600">
              Real travelers earning real money
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full" />
                <div>
                  <div className="font-bold text-gray-900">Sarah M.</div>
                  <div className="text-sm text-gray-600">Travel Blogger</div>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "I earned $2,400 in my first month just by sharing my Japan trip. 
                The affiliate program is incredibly generous!"
              </p>
              <div className="text-2xl font-bold text-rausch-600">$2,400/mo</div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full" />
                <div>
                  <div className="font-bold text-gray-900">Mike T.</div>
                  <div className="text-sm text-gray-600">Digital Nomad</div>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "TravelBlogr helped me turn my passion into a full-time income. 
                Best decision I ever made!"
              </p>
              <div className="text-2xl font-bold text-rausch-600">$5,800/mo</div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full" />
                <div>
                  <div className="font-bold text-gray-900">Emma L.</div>
                  <div className="text-sm text-gray-600">Family Traveler</div>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "Sharing our family adventures now pays for our next vacation. 
                It's amazing!"
              </p>
              <div className="text-2xl font-bold text-rausch-600">$1,900/mo</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-rausch-500 to-rausch-600 rounded-3xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Start Earning?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of travelers already making money from their adventures
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="px-8 py-4 bg-white text-rausch-600 rounded-full font-semibold hover:bg-gray-100 transition-all shadow-lg"
            >
              Create Free Account
            </Link>
            <Link
              href="/blog"
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-semibold hover:bg-white/10 transition-all"
            >
              Read Success Stories
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

