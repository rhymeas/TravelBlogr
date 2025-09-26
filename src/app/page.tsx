import Link from 'next/link'
import { ArrowRight, Globe, Users, Shield, Camera, Map, Share2 } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white sticky top-0 z-50 border-b border-gray-300 shadow-airbnb-light">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8" aria-label="Global">
          {/* Logo */}
          <div className="flex lg:flex-1">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-rausch-500 rounded-lg flex items-center justify-center">
                <Globe className="h-5 w-5 text-white" />
              </div>
              <span className="text-title-medium text-airbnb-black font-semibold">TravelBlogr</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex lg:items-center lg:gap-8">
            <Link
              href="/locations"
              className="text-body-large font-medium text-airbnb-black hover:text-airbnb-dark-gray transition-colors py-2 px-3 rounded-lg hover:bg-gray-50"
            >
              Locations
            </Link>
            <Link
              href="/live-feed"
              className="text-body-large font-medium text-airbnb-black hover:text-airbnb-dark-gray transition-colors py-2 px-3 rounded-lg hover:bg-gray-50"
            >
              Live Feed
            </Link>
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
      </header>

      {/* Hero Section */}
      <section className="relative bg-white py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center rounded-full bg-gray-50 px-4 py-2 text-body-medium text-airbnb-dark-gray border border-gray-200">
              <span className="mr-2">✨</span>
              Share your travel stories with the world
              <ArrowRight className="ml-2 h-4 w-4" />
            </div>

            {/* Main Heading */}
            <h1 className="text-display-large text-airbnb-black mb-6 leading-tight">
              Your Travel Stories,{' '}
              <span className="bg-gradient-to-r from-rausch-500 to-rausch-700 bg-clip-text text-transparent">
                Beautifully Shared
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-body-large text-airbnb-dark-gray mb-10 max-w-2xl mx-auto leading-relaxed">
              Create stunning travel blogs, share with specific audiences, and keep your memories alive.
              From family updates to professional portfolios — all in one place.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                href="/auth/signup"
                className="btn-primary px-8 py-4 text-body-large font-semibold rounded-airbnb-small w-full sm:w-auto hover:scale-105 transition-transform inline-flex items-center justify-center gap-2"
              >
                Start Your Journey
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#features"
                className="btn-secondary px-8 py-4 text-body-large font-semibold rounded-airbnb-small w-full sm:w-auto flex items-center justify-center gap-2"
              >
                See Examples
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Section Header */}
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-display-small text-airbnb-black mb-4">
              Everything you need to share your journey
            </h2>
            <p className="text-body-large text-airbnb-dark-gray leading-relaxed">
              Create stunning travel blogs, share with specific audiences, and keep your memories alive.
              Professional portfolios, family updates, or public inspiration — all in one platform.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="card-elevated p-8 hover:shadow-airbnb-large transition-all duration-300 group">
              <div className="w-12 h-12 bg-rausch-500 rounded-airbnb-medium flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Share2 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-title-small text-airbnb-black mb-3 font-semibold">
                Audience-Specific Sharing
              </h3>
              <p className="text-body-large text-airbnb-dark-gray leading-relaxed">
                Create different share links for family, friends, and professional networks with customized content and privacy settings.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card-elevated p-8 hover:shadow-airbnb-large transition-all duration-300 group">
              <div className="w-12 h-12 bg-rausch-500 rounded-airbnb-medium flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Map className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-title-small text-airbnb-black mb-3 font-semibold">
                Interactive Maps
              </h3>
              <p className="text-body-large text-airbnb-dark-gray leading-relaxed">
                Beautiful interactive maps showing your journey with real-time location tracking and route visualization.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card-elevated p-8 hover:shadow-airbnb-large transition-all duration-300 group">
              <div className="w-12 h-12 bg-rausch-500 rounded-airbnb-medium flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-title-small text-airbnb-black mb-3 font-semibold">
                Media Management
              </h3>
              <p className="text-body-large text-airbnb-dark-gray leading-relaxed">
                Upload and organize photos and videos with automatic optimization, galleries, and location tagging.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card-elevated p-8 hover:shadow-airbnb-large transition-all duration-300 group">
              <div className="w-12 h-12 bg-rausch-500 rounded-airbnb-medium flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-title-small text-airbnb-black mb-3 font-semibold">
                Privacy Controls
              </h3>
              <p className="text-body-large text-airbnb-dark-gray leading-relaxed">
                Granular privacy settings with password protection, expiration dates, and viewer analytics.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="card-elevated p-8 hover:shadow-airbnb-large transition-all duration-300 group">
              <div className="w-12 h-12 bg-rausch-500 rounded-airbnb-medium flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-title-small text-airbnb-black mb-3 font-semibold">
                Real-time Updates
              </h3>
              <p className="text-body-large text-airbnb-dark-gray leading-relaxed">
                Keep your loved ones updated with live location sharing and real-time post notifications.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="card-elevated p-8 hover:shadow-airbnb-large transition-all duration-300 group">
              <div className="w-12 h-12 bg-rausch-500 rounded-airbnb-medium flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-title-small text-airbnb-black mb-3 font-semibold">
                Professional Portfolios
              </h3>
              <p className="text-body-large text-airbnb-dark-gray leading-relaxed">
                Create stunning professional travel portfolios with SEO optimization and custom branding.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-display-small text-airbnb-black mb-4">
              Ready to start sharing your journey?
            </h2>
            <p className="text-body-large text-airbnb-dark-gray mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of travelers who trust TravelBlogr to share their adventures with the world.
            </p>
            <Link
              href="/auth/signup"
              className="btn-primary px-8 py-4 text-body-large font-semibold rounded-airbnb-small hover:scale-105 transition-transform inline-flex items-center gap-2"
            >
              Get Started for Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-rausch-500 rounded-lg flex items-center justify-center">
                <Globe className="h-5 w-5 text-white" />
              </div>
              <span className="text-title-medium text-airbnb-black font-semibold">
                TravelBlogr
              </span>
            </div>
            <p className="text-body-medium text-airbnb-dark-gray">
              © 2024 TravelBlogr. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
