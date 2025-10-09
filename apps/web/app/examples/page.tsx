import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Globe, MapPin, Menu, User, Bell, ArrowRight, Eye, Heart, Share2, Calendar, Clock, Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Examples - See TravelBlogr in Action',
  description: 'Explore real travel stories created with TravelBlogr. See how different travelers share their journeys with various audiences.',
}

const examples = [
  {
    id: 1,
    title: 'Kanada Reise 2024',
    subtitle: 'Epic Road Trip Through the Canadian Rockies',
    author: 'Sarah & Mike',
    location: 'Canada',
    duration: '21 days',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwxfHxjYW5hZGElMjByb2NraWVzfGVufDB8MHx8fDE3MDk4NTkyNTl8MA&ixlib=rb-4.1.0&q=85&w=800',
    description: 'From Vancouver to Calgary, through Banff and Jasper National Parks. A complete journey with daily updates, stunning photography, and practical travel tips.',
    stats: { views: 12500, likes: 890, shares: 156 },
    tags: ['Road Trip', 'Nature', 'Photography', 'Adventure'],
    featured: true,
    url: '/examples/kanada-reise-2024'
  },
  {
    id: 2,
    title: 'Tokyo Food Adventure',
    subtitle: 'A Culinary Journey Through Japan\'s Capital',
    author: 'Chef Maria',
    location: 'Tokyo, Japan',
    duration: '10 days',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwxfHx0b2t5byUyMGZvb2R8ZW58MHwwfHx8MTcwOTg1OTI1OXww&ixlib=rb-4.1.0&q=85&w=800',
    description: 'From street food in Shibuya to Michelin-starred restaurants in Ginza. Every meal documented with recipes, restaurant recommendations, and cultural insights.',
    stats: { views: 8900, likes: 1200, shares: 234 },
    tags: ['Food', 'Culture', 'City', 'Restaurants'],
    featured: true,
    url: '/examples/tokyo-food-adventure'
  },
  {
    id: 3,
    title: 'Backpacking Southeast Asia',
    subtitle: 'Budget Travel Through 6 Countries',
    author: 'Alex Thompson',
    location: 'Southeast Asia',
    duration: '3 months',
    image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwxfHxzb3V0aGVhc3QlMjBhc2lhJTIwdGVtcGxlfGVufDB8MHx8fDE3MDk4NTkyNTl8MA&ixlib=rb-4.1.0&q=85&w=800',
    description: 'Thailand, Vietnam, Cambodia, Laos, Myanmar, and Malaysia on $30/day. Complete budget breakdowns, hostel reviews, and off-the-beaten-path discoveries.',
    stats: { views: 15600, likes: 2100, shares: 445 },
    tags: ['Backpacking', 'Budget', 'Culture', 'Temples'],
    featured: false,
    url: '/examples/backpacking-southeast-asia'
  },
  {
    id: 4,
    title: 'Iceland Ring Road',
    subtitle: 'Chasing Northern Lights and Waterfalls',
    author: 'Nordic Wanderers',
    location: 'Iceland',
    duration: '14 days',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwxfHxpY2VsYW5kJTIwbm9ydGhlcm4lMjBsaWdodHN8ZW58MHwwfHx8MTcwOTg1OTI1OXww&ixlib=rb-4.1.0&q=85&w=800',
    description: 'Complete Ring Road plan with Northern Lights photography tips, hot spring locations, and weather-dependent backup plans.',
    stats: { views: 9800, likes: 1450, shares: 287 },
    tags: ['Photography', 'Nature', 'Northern Lights', 'Road Trip'],
    featured: false,
    url: '/examples/iceland-ring-road'
  },
  {
    id: 5,
    title: 'Family Safari Kenya',
    subtitle: 'Wildlife Adventure with Kids',
    author: 'The Johnson Family',
    location: 'Kenya',
    duration: '12 days',
    image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwxfHxrZW55YSUyMHNhZmFyaXxlbnwwfDB8fHwxNzA5ODU5MjU5fDA&ixlib=rb-4.1.0&q=85&w=800',
    description: 'Masai Mara, Amboseli, and Tsavo with children aged 8 and 12. Family-friendly lodges, wildlife spotting guides, and educational activities.',
    stats: { views: 6700, likes: 890, shares: 123 },
    tags: ['Family', 'Wildlife', 'Safari', 'Education'],
    featured: false,
    url: '/examples/family-safari-kenya'
  },
  {
    id: 6,
    title: 'European Art Cities',
    subtitle: 'Museums, Galleries, and Cultural Heritage',
    author: 'Art History Prof',
    location: 'Europe',
    duration: '28 days',
    image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwxfHxldXJvcGUlMjBhcnQlMjBtdXNldW18ZW58MHwwfHx8MTcwOTg1OTI1OXww&ixlib=rb-4.1.0&q=85&w=800',
    description: 'Paris, Florence, Vienna, Amsterdam, and Barcelona. In-depth museum guides, art history context, and hidden gallery recommendations.',
    stats: { views: 4200, likes: 650, shares: 89 },
    tags: ['Art', 'Culture', 'Museums', 'History'],
    featured: false,
    url: '/examples/european-art-cities'
  }
]

export default function ExamplesPage() {
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

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:gap-x-8">
            <Link href="/locations" className="text-body-medium text-airbnb-gray hover:text-airbnb-black transition-colors">
              Locations
            </Link>
            <Link href="/live-feed" className="text-body-medium text-airbnb-gray hover:text-airbnb-black transition-colors">
              Live Feed
            </Link>
            <Link href="/examples" className="text-body-medium text-airbnb-gray hover:text-airbnb-black transition-colors font-semibold text-airbnb-black">
              Examples
            </Link>
            <Link href="/pricing" className="text-body-medium text-airbnb-gray hover:text-airbnb-black transition-colors">
              Pricing
            </Link>
          </div>

          {/* Right side actions */}
          <div className="flex lg:flex-1 lg:justify-end items-center gap-4">
            <div className="hidden lg:flex items-center gap-3">
              <Link href="/auth/signin" className="text-body-medium text-airbnb-gray hover:text-airbnb-black transition-colors">
                Sign in
              </Link>
              <Button asChild className="bg-rausch-500 hover:bg-rausch-600 text-white">
                <Link href="/auth/signup">
                  Get Started
                </Link>
              </Button>
            </div>
            
            {/* Mobile menu button */}
            <Button variant="ghost" size="sm" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </nav>
      </header>

      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-rausch-50 to-kazan-50 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-display-large font-bold text-airbnb-black mb-6">
                Real Travel Stories
              </h1>
              <p className="text-title-medium text-airbnb-dark-gray max-w-3xl mx-auto mb-8">
                See how travelers around the world use TravelBlogr to document and share their journeys. 
                From epic road trips to cultural deep-dives, every story is unique.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-rausch-500 hover:bg-rausch-600 text-white">
                  <Link href="/auth/signup" className="flex items-center gap-2">
                    <span>Create Your Story</span>
                    <ArrowRight className="h-4 w-4 flex-shrink-0" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/locations">
                    Explore Locations
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Examples */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-display-medium font-bold text-airbnb-black mb-4">
                Featured Stories
              </h2>
              <p className="text-title-small text-airbnb-dark-gray max-w-2xl mx-auto">
                Handpicked travel stories that showcase the best of what's possible with TravelBlogr
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
              {examples.filter(example => example.featured).map((example) => (
                <div key={example.id} className="group cursor-pointer">
                  <div className="card-elevated hover:shadow-airbnb-large transition-all duration-300 overflow-hidden">
                    <div className="relative h-64 lg:h-80">
                      <Image
                        src={example.image}
                        alt={example.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {example.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="bg-white/20 text-white border-white/30">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <h3 className="text-title-large font-bold text-white mb-2">
                          {example.title}
                        </h3>
                        <p className="text-body-medium text-white/90 mb-3">
                          {example.subtitle}
                        </p>
                        <div className="flex items-center justify-between text-white/80 text-body-small">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {example.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {example.duration}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-body-medium text-airbnb-dark-gray mb-4">
                        {example.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-body-small text-airbnb-gray">
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {example.stats.views.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {example.stats.likes.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Share2 className="h-4 w-4" />
                            {example.stats.shares}
                          </span>
                        </div>
                        <p className="text-body-small text-airbnb-gray">
                          by {example.author}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* More Examples Grid */}
            <div className="text-center mb-12">
              <h3 className="text-title-large font-bold text-airbnb-black mb-4">
                More Inspiring Stories
              </h3>
              <p className="text-body-medium text-airbnb-dark-gray">
                Discover diverse travel experiences from our community
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {examples.filter(example => !example.featured).map((example) => (
                <div key={example.id} className="group cursor-pointer">
                  <div className="card-elevated hover:shadow-airbnb-large transition-all duration-300 overflow-hidden">
                    <div className="relative h-48">
                      <Image
                        src={example.image}
                        alt={example.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <h4 className="text-body-large font-semibold text-white mb-1">
                          {example.title}
                        </h4>
                        <p className="text-body-small text-white/90">
                          {example.location} • {example.duration}
                        </p>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-body-small text-airbnb-dark-gray mb-3 line-clamp-2">
                        {example.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {example.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-body-small text-airbnb-gray">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {(example.stats.views / 1000).toFixed(1)}k
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {example.stats.likes}
                          </span>
                        </div>
                        <p className="text-xs">
                          {example.author}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Call to Action */}
            <div className="text-center mt-16 p-8 bg-gradient-to-r from-rausch-50 to-kazan-50 rounded-airbnb-large">
              <h3 className="text-title-large font-bold text-airbnb-black mb-4">
                Ready to Share Your Story?
              </h3>
              <p className="text-body-medium text-airbnb-dark-gray mb-6 max-w-2xl mx-auto">
                Join thousands of travelers who use TravelBlogr to document their journeys and connect with different audiences.
                Your next adventure deserves to be shared beautifully.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-rausch-500 hover:bg-rausch-600 text-white">
                  <Link href="/auth/signup">
                    Start Your Journey
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/live-feed">
                    See Live Updates
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
